// ============================================================
// API CONTRACTS - myTrimmy-prep
// Generated: 2026-01-14
// ============================================================
//
// API-FIRST DESIGN: Define request/response contracts BEFORE routes.
// These types are shared between client and server.
// Frontend uses these for type-safe API calls.
// Backend uses these to validate and respond.
//
// ============================================================

import type { Result } from "./errors.js";
import type { ApiError, ValidationError } from "./errors.js";

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

/**
 * Standard API response envelope.
 * All API responses use this shape.
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly type: string;
    readonly message: string;
    readonly details?: ValidationError[];
    readonly requestId?: string;
  };
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
    readonly hasMore?: boolean;
  };
}

// Response constructors
export const apiSuccess = <T>(data: T, meta?: ApiResponse<T>["meta"]): ApiResponse<T> => ({
  success: true,
  data,
  meta,
});

export const apiError = (error: ApiError, requestId?: string): ApiResponse<never> => ({
  success: false,
  error: {
    type: error.type,
    message: "message" in error ? error.message : error.type,
    details: error.type === "bad_request" ? error.details : undefined,
    requestId,
  },
});

// ============================================================
// PAGINATION
// ============================================================

export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

// ============================================================
// ENTITY API CONTRACTS
// ============================================================


// ============================================================
// BATCH OPERATIONS
// ============================================================


// ============================================================
// ACTION ENDPOINTS (non-CRUD operations)
// ============================================================

// ============================================================
// TYPE-SAFE FETCH WRAPPER
// ============================================================

/**
 * Type-safe API client interface.
 * Implement this for your HTTP client (fetch, axios, etc.)
 */
// No entities defined - ApiClient type is a placeholder
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ApiClient {}

// ============================================================
// WEBHOOK PAYLOADS (if using webhooks)
// ============================================================


// No entities defined - WebhookPayload type not generated
export type WebhookPayload = never;

// ============================================================
// DISCRIMINATED UNION TYPES FOR API RESPONSES (API-001)
// ============================================================

/**
 * Base discriminated union type for API responses.
 * Ensures type-safe error handling at compile time.
 *
 * Usage:
 *   const result: ApiResult<User, UserApiError> = await fetchUser(id);
 *   if (isApiSuccess(result)) {
 *     console.log(result.data); // Type-safe access to User
 *   } else {
 *     console.error(result.error); // Type-safe access to UserApiError
 *   }
 */
export type ApiResult<T, E = string> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E; readonly code?: string };

// ============================================================
// DOMAIN-SPECIFIC API ERROR TYPES
// ============================================================

/**
 * Common structure for all API errors.
 * Each domain extends this with specific error codes.
 */
export interface ApiErrorBase {
  readonly message: string;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Video Bundle API error codes.
 * Maps to specific failure modes in video generation flow.
 */
export interface VideoBundleApiError extends ApiErrorBase {
  readonly code:
    | 'INVALID_URL'
    | 'RATE_LIMITED'
    | 'SUBSCRIPTION_REQUIRED'
    | 'GENERATION_FAILED'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'SERVER_ERROR';
}

export type VideoBundleResult<T> = ApiResult<T, VideoBundleApiError>;

/**
 * Fal.ai Job API error codes.
 * Maps to job lifecycle failure modes.
 */
export interface FalJobApiError extends ApiErrorBase {
  readonly code:
    | 'JOB_NOT_FOUND'
    | 'JOB_FAILED'
    | 'TIMEOUT'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR';
}

export type FalJobResult<T> = ApiResult<T, FalJobApiError>;

/**
 * Webhook API error codes.
 * Maps to webhook processing failure modes.
 */
export interface WebhookApiError extends ApiErrorBase {
  readonly code:
    | 'INVALID_SIGNATURE'
    | 'INVALID_PAYLOAD'
    | 'JOB_NOT_FOUND'
    | 'PROCESSING_FAILED';
}

export type WebhookResult<T> = ApiResult<T, WebhookApiError>;

// ============================================================
// TYPE GUARDS FOR DISCRIMINATED UNIONS
// ============================================================

/**
 * Type guard for successful API results.
 * Narrows the type to access `data` property.
 */
export function isApiSuccess<T, E>(
  result: ApiResult<T, E>
): result is { readonly success: true; readonly data: T } {
  return result.success === true;
}

/**
 * Type guard for failed API results.
 * Narrows the type to access `error` property.
 */
export function isApiError<T, E>(
  result: ApiResult<T, E>
): result is { readonly success: false; readonly error: E; readonly code?: string } {
  return result.success === false;
}

// ============================================================
// RESULT CONSTRUCTORS
// ============================================================

/**
 * Create a successful API result.
 * @param data The success payload
 */
export function apiOk<T>(data: T): { readonly success: true; readonly data: T } {
  return { success: true, data } as const;
}

/**
 * Create a failed API result.
 * @param error The error payload
 * @param code Optional error code for categorization
 */
export function apiErr<E>(
  error: E,
  code?: string
): { readonly success: false; readonly error: E; readonly code?: string } {
  return { success: false, error, code } as const;
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
