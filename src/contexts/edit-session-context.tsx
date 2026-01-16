'use client';

/**
 * Edit Session Context
 *
 * Provides edit history state and actions to components.
 * Manages the lifecycle of edit sessions with undo/redo support.
 */

import * as React from 'react';
import type {
  EditSessionState,
  EditSessionContextValue,
  EditSessionActions,
  EditOperation,
  StartEditSessionResponse,
  ApplyOperationResponse,
  UndoRedoResponse,
  SaveSessionResponse,
  EditErrorResponse,
} from '@/types/edit-history';

// Initial state
const INITIAL_STATE: EditSessionState = {
  session: null as unknown as EditSessionState['session'],
  operations: [],
  canUndo: false,
  canRedo: false,
  isProcessing: false,
  currentDisplayUrl: '',
  error: null,
};

// Context
const EditSessionContext = React.createContext<EditSessionContextValue | null>(null);

// Provider props
interface EditSessionProviderProps {
  children: React.ReactNode;
  /** Original image URL (used when position is 0) */
  originalUrl?: string;
}

export function EditSessionProvider({ children, originalUrl }: EditSessionProviderProps) {
  const [state, setState] = React.useState<EditSessionState>({
    ...INITIAL_STATE,
    currentDisplayUrl: originalUrl || '',
  });
  const [currentImageId, setCurrentImageId] = React.useState<string | null>(null);

  // Update display URL when originalUrl changes
  React.useEffect(() => {
    if (originalUrl && !state.session) {
      setState(prev => ({ ...prev, currentDisplayUrl: originalUrl }));
    }
  }, [originalUrl, state.session]);

  // API helpers
  const callApi = async <T,>(
    url: string,
    options?: RequestInit
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: (result as EditErrorResponse).error || 'Request failed' };
      }

      return { data: result as T, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Network error' };
    }
  };

  // Actions
  const actions: EditSessionActions = {
    startSession: async (imageId: string, forceNew = false) => {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      setCurrentImageId(imageId);

      const { data, error } = await callApi<StartEditSessionResponse>(
        `/api/images/${imageId}/edit/start`,
        { body: JSON.stringify({ forceNew }) }
      );

      if (error || !data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error || 'Failed to start session',
        }));
        return;
      }

      setState({
        session: data.session,
        operations: data.operations,
        canUndo: data.canUndo,
        canRedo: data.canRedo,
        isProcessing: false,
        currentDisplayUrl: data.currentDisplayUrl,
        error: null,
      });
    },

    applyOperation: async (operation: EditOperation) => {
      if (!currentImageId) {
        setState(prev => ({ ...prev, error: 'No image selected' }));
        return;
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const { data, error } = await callApi<ApplyOperationResponse>(
        `/api/images/${currentImageId}/edit/operation`,
        { body: JSON.stringify({ operation }) }
      );

      if (error || !data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error || 'Operation failed',
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        session: data.session,
        operations: [...prev.operations.filter(op => op.position < data.operation.position), data.operation],
        canUndo: data.canUndo,
        canRedo: data.canRedo,
        isProcessing: false,
        currentDisplayUrl: data.currentDisplayUrl,
        error: null,
      }));
    },

    undo: async () => {
      if (!currentImageId || !state.canUndo) return;

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const { data, error } = await callApi<UndoRedoResponse>(
        `/api/images/${currentImageId}/edit/undo`
      );

      if (error || !data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error || 'Undo failed',
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        session: data.session,
        canUndo: data.canUndo,
        canRedo: data.canRedo,
        isProcessing: false,
        currentDisplayUrl: data.currentDisplayUrl,
        error: null,
      }));
    },

    redo: async () => {
      if (!currentImageId || !state.canRedo) return;

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const { data, error } = await callApi<UndoRedoResponse>(
        `/api/images/${currentImageId}/edit/redo`
      );

      if (error || !data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error || 'Redo failed',
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        session: data.session,
        canUndo: data.canUndo,
        canRedo: data.canRedo,
        isProcessing: false,
        currentDisplayUrl: data.currentDisplayUrl,
        error: null,
      }));
    },

    save: async () => {
      if (!currentImageId) {
        throw new Error('No image selected');
      }

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const { data, error } = await callApi<SaveSessionResponse>(
        `/api/images/${currentImageId}/edit/save`
      );

      if (error || !data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: error || 'Save failed',
        }));
        throw new Error(error || 'Save failed');
      }

      // Reset state after save
      setState({
        ...INITIAL_STATE,
        currentDisplayUrl: data.processed_url,
      });
      setCurrentImageId(null);

      return data.processed_url;
    },

    discard: async () => {
      if (!currentImageId) return;

      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const { error } = await callApi<{ success: true }>(
        `/api/images/${currentImageId}/edit/discard`
      );

      // Reset state regardless of error
      setState({
        ...INITIAL_STATE,
        currentDisplayUrl: originalUrl || '',
        error: error || null,
      });
      setCurrentImageId(null);
    },

    reset: () => {
      setState({
        ...INITIAL_STATE,
        currentDisplayUrl: originalUrl || '',
      });
      setCurrentImageId(null);
    },
  };

  const contextValue: EditSessionContextValue = {
    ...state,
    actions,
    hasSession: !!state.session && state.session.status === 'active',
  };

  return (
    <EditSessionContext.Provider value={contextValue}>
      {children}
    </EditSessionContext.Provider>
  );
}

// Hook
export function useEditSession() {
  const context = React.useContext(EditSessionContext);
  if (!context) {
    throw new Error('useEditSession must be used within an EditSessionProvider');
  }
  return context;
}

// Optional hook that doesn't throw
export function useEditSessionOptional() {
  return React.useContext(EditSessionContext);
}
