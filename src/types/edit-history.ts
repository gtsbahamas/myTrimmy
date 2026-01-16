/**
 * Edit History Types - Non-Destructive Editing
 *
 * TYPE-FIRST DESIGN: These types are the contract.
 * Implementation MUST conform to these types.
 */

// ============================================================
// OPERATION TYPES
// ============================================================

/** Trim operation - auto-trim whitespace/borders */
export interface TrimOperation {
  type: 'trim';
  params: {
    threshold: number; // 0-255, default 10
    lineArt: boolean;  // default false
  };
}

/** Crop operation - extract region */
export interface CropOperation {
  type: 'crop';
  params: {
    mode: 'manual' | 'aspect';
    // Manual mode
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    // Aspect mode
    aspectRatio?: string; // e.g., "16:9"
  };
}

/** Rotate operation - rotate and/or flip */
export interface RotateOperation {
  type: 'rotate';
  params: {
    angle: 0 | 90 | 180 | 270;
    flipH?: boolean;
    flipV?: boolean;
  };
}

/** Resize operation - scale image */
export interface ResizeOperation {
  type: 'resize';
  params: {
    width?: number;
    height?: number;
    fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    withoutEnlargement?: boolean;
  };
}

/** Optimize operation - compress */
export interface OptimizeOperation {
  type: 'optimize';
  params: {
    quality: number; // 1-100
  };
}

/** Convert operation - change format */
export interface ConvertOperation {
  type: 'convert';
  params: {
    format: 'jpeg' | 'png' | 'webp';
  };
}

/** Remove background operation - expensive, needs pre-snapshot */
export interface RemoveBackgroundOperation {
  type: 'removeBackground';
  params: Record<string, never>; // No params needed
}

/** Union of all operation types */
export type EditOperation =
  | TrimOperation
  | CropOperation
  | RotateOperation
  | ResizeOperation
  | OptimizeOperation
  | ConvertOperation
  | RemoveBackgroundOperation;

/** Operation type strings */
export type EditOperationType = EditOperation['type'];

/** Operations that are expensive and need pre-snapshot for fast undo */
export const EXPENSIVE_OPERATIONS: EditOperationType[] = ['removeBackground'];

// ============================================================
// DATABASE TYPES
// ============================================================

/** Edit session status */
export type EditSessionStatus = 'active' | 'saved' | 'abandoned';

/** Database record for edit_sessions table */
export interface EditSession {
  id: string;
  image_id: string;
  user_id: string;
  current_position: number;
  current_snapshot_url: string | null;
  status: EditSessionStatus;
  created_at: string;
  updated_at: string;
  saved_at: string | null;
  version: number;
}

/** Database record for edit_operations table */
export interface EditOperationRecord {
  id: string;
  session_id: string;
  position: number;
  operation_type: EditOperationType;
  params: EditOperation['params'];
  pre_snapshot_url: string | null;
  post_snapshot_url: string | null;
  created_at: string;
  duration_ms: number | null;
}

// ============================================================
// API TYPES
// ============================================================

/** Request to start or resume an edit session */
export interface StartEditSessionRequest {
  /** If true, create new session even if one exists (abandons old) */
  forceNew?: boolean;
}

/** Response from starting an edit session */
export interface StartEditSessionResponse {
  success: true;
  session: EditSession;
  operations: EditOperationRecord[];
  currentDisplayUrl: string;
  canUndo: boolean;
  canRedo: boolean;
}

/** Request to apply a new operation */
export interface ApplyOperationRequest {
  operation: EditOperation;
}

/** Response from applying an operation */
export interface ApplyOperationResponse {
  success: true;
  session: EditSession;
  operation: EditOperationRecord;
  currentDisplayUrl: string;
  canUndo: boolean;
  canRedo: boolean;
}

/** Response from undo/redo */
export interface UndoRedoResponse {
  success: true;
  session: EditSession;
  currentDisplayUrl: string;
  canUndo: boolean;
  canRedo: boolean;
}

/** Response from saving a session */
export interface SaveSessionResponse {
  success: true;
  session: EditSession;
  processed_url: string;
  message: string;
}

/** Response from discarding a session */
export interface DiscardSessionResponse {
  success: true;
  message: string;
}

/** Error response */
export interface EditErrorResponse {
  error: string;
  code?: string;
}

// ============================================================
// CLIENT STATE TYPES
// ============================================================

/** Full client-side session state */
export interface EditSessionState {
  session: EditSession;
  operations: EditOperationRecord[];
  canUndo: boolean;
  canRedo: boolean;
  isProcessing: boolean;
  currentDisplayUrl: string;
  error: string | null;
}

/** Initial state when no session exists */
export const INITIAL_EDIT_STATE: EditSessionState = {
  session: null as unknown as EditSession,
  operations: [],
  canUndo: false,
  canRedo: false,
  isProcessing: false,
  currentDisplayUrl: '',
  error: null,
};

// ============================================================
// CONTEXT TYPES
// ============================================================

/** Actions available in EditSessionContext */
export interface EditSessionActions {
  /** Start or resume an edit session for an image */
  startSession: (imageId: string, forceNew?: boolean) => Promise<void>;

  /** Apply a new operation */
  applyOperation: (operation: EditOperation) => Promise<void>;

  /** Undo the last operation */
  undo: () => Promise<void>;

  /** Redo the last undone operation */
  redo: () => Promise<void>;

  /** Save the session (finalize processed_url) */
  save: () => Promise<string>;

  /** Discard the session and return to original */
  discard: () => Promise<void>;

  /** Reset local state (not database) */
  reset: () => void;
}

/** Combined context value */
export interface EditSessionContextValue extends EditSessionState {
  actions: EditSessionActions;
  hasSession: boolean;
}

// ============================================================
// UTILITY TYPES
// ============================================================

/** Extract params type from operation type */
export type OperationParams<T extends EditOperationType> = Extract<
  EditOperation,
  { type: T }
>['params'];

/** Type guard for operation types */
export function isOperationType<T extends EditOperationType>(
  op: EditOperation,
  type: T
): op is Extract<EditOperation, { type: T }> {
  return op.type === type;
}

/** Check if operation is expensive (needs pre-snapshot) */
export function isExpensiveOperation(op: EditOperation): boolean {
  return EXPENSIVE_OPERATIONS.includes(op.type);
}
