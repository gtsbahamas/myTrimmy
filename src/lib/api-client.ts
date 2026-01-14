/**
 * API Client Library - myTrimmy-prep
 * Generated: 2026-01-14
 *
 * Type-safe API client with React Query hooks for data fetching.
 * Uses TanStack Query for caching, optimistic updates, and request deduplication.
 *
 * Usage:
 *   const { data, isLoading } = useEntityList();
 *   const { mutate: create } = useCreateEntity();
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryClient,
} from '@tanstack/react-query';
import type { ApiResponse, PaginationParams, PaginatedResponse } from '@/types/api';

// ============================================================
// API CLIENT CONFIGURATION
// ============================================================

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getToken?: () => Promise<string | null>;
  readonly onUnauthorized?: () => void;
  readonly retryCount?: number;
  readonly retryDelay?: number;
}

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  retryCount: 3,
  retryDelay: 1000,
};

let clientConfig: ApiClientConfig = DEFAULT_CONFIG;

/**
 * Configure the API client.
 * Call this once at app initialization.
 */
export function configureApiClient(config: Partial<ApiClientConfig>): void {
  clientConfig = { ...DEFAULT_CONFIG, ...config };
}

// ============================================================
// API CLIENT ERROR TYPES
// ============================================================

export type ApiErrorCode =
  | 'network_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'server_error'
  | 'unknown';

export interface ApiClientError {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly status?: number;
  readonly details?: unknown;
}

// ============================================================
// OPTIMISTIC UPDATE TYPES
// ============================================================

/**
 * Marker for temporary IDs used in optimistic updates.
 * Allows distinguishing optimistic items from server-confirmed items.
 */
export const TEMP_ID_PREFIX = '__temp__' as const;

/**
 * Type guard to check if an ID is a temporary optimistic ID.
 */
export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}

/**
 * Generate a unique temporary ID for optimistic items.
 */
export function generateTempId(): string {
  return `${TEMP_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Context for optimistic mutations, storing previous state for rollback.
 */
export interface OptimisticContext<T> {
  readonly previousData: T | undefined;
  readonly previousList: PaginatedResponse<T> | undefined;
}

/**
 * Options for optimistic update behavior.
 */
export interface OptimisticOptions {
  /** Whether to update the list cache optimistically (default: true) */
  readonly updateList?: boolean;
  /** Whether to update the detail cache optimistically (default: true) */
  readonly updateDetail?: boolean;
  /** Custom rollback handler */
  readonly onRollback?: (error: Error) => void;
}

// ============================================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================================

/**
 * Create an optimistic item with temporary ID and timestamps.
 * Use this when creating items before server confirmation.
 */
export function createOptimisticItem<T extends { id: string }>(
  input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  overrides?: Partial<T>
): T {
  const now = new Date();
  return {
    id: generateTempId(),
    createdAt: now,
    updatedAt: now,
    ...input,
    ...overrides,
  } as unknown as T;
}

/**
 * Rollback optimistic changes by restoring previous cache state.
 * Generic utility for manual rollback scenarios.
 */
export function rollbackOptimistic<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  previousData: T | undefined
): void {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  } else {
    queryClient.removeQueries({ queryKey });
  }
}

/**
 * Add an item optimistically to a paginated list cache.
 * Returns the previous list state for potential rollback.
 */
export function addToListOptimistic<T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  newItem: T,
  position: 'start' | 'end' = 'start'
): PaginatedResponse<T> | undefined {
  const previousList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

  if (previousList) {
    const updatedItems = position === 'start'
      ? [newItem, ...previousList.items]
      : [...previousList.items, newItem];

    queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
      ...previousList,
      items: updatedItems,
      total: previousList.total + 1,
    });
  }

  return previousList;
}

/**
 * Update an item optimistically in a paginated list cache.
 * Returns the previous list state for potential rollback.
 */
export function updateInListOptimistic<T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  id: string,
  updates: Partial<T>
): PaginatedResponse<T> | undefined {
  const previousList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

  if (previousList) {
    queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
      ...previousList,
      items: previousList.items.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    });
  }

  return previousList;
}

/**
 * Remove an item optimistically from a paginated list cache.
 * Returns the previous list state for potential rollback.
 */
export function removeFromListOptimistic<T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  id: string
): PaginatedResponse<T> | undefined {
  const previousList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);

  if (previousList) {
    queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
      ...previousList,
      items: previousList.items.filter((item) => item.id !== id),
      total: Math.max(0, previousList.total - 1),
    });
  }

  return previousList;
}

// ============================================================
// OPTIMISTIC UPDATE HOOKS
// ============================================================

/**
 * Hook for optimistically adding items to a list cache.
 * Returns utilities for adding, confirming, and rolling back optimistic items.
 */
export function useOptimisticCreate<T extends { id: string }>(
  listQueryKey: readonly unknown[]
) {
  const queryClient = useQueryClient();

  return {
    /**
     * Add an optimistic item to the list.
     * Returns the temp ID and previous state for rollback.
     */
    addOptimistic: (item: T, position: 'start' | 'end' = 'start') => {
      const previousList = addToListOptimistic<T>(queryClient, listQueryKey, item, position);
      return { tempId: item.id, previousList };
    },

    /**
     * Confirm an optimistic item by replacing it with the server response.
     */
    confirmOptimistic: (tempId: string, confirmedItem: T) => {
      const currentList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);
      if (currentList) {
        queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
          ...currentList,
          items: currentList.items.map((item) =>
            item.id === tempId ? confirmedItem : item
          ),
        });
      }
      // Also set the detail cache
      const detailKey = [...listQueryKey.slice(0, 1), 'detail', confirmedItem.id];
      queryClient.setQueryData(detailKey, confirmedItem);
    },

    /**
     * Rollback an optimistic add by restoring previous list state.
     */
    rollback: (previousList: PaginatedResponse<T> | undefined) => {
      rollbackOptimistic(queryClient, listQueryKey, previousList);
    },
  };
}

/**
 * Hook for optimistically updating items in cache.
 * Returns utilities for updating, confirming, and rolling back optimistic updates.
 */
export function useOptimisticUpdate<T extends { id: string }>(
  listQueryKey: readonly unknown[],
  getDetailKey: (id: string) => readonly unknown[]
) {
  const queryClient = useQueryClient();

  return {
    /**
     * Update an item optimistically in both list and detail caches.
     * Returns previous states for rollback.
     */
    updateOptimistic: (id: string, updates: Partial<T>) => {
      const detailKey = getDetailKey(id);

      // Get previous states
      const previousDetail = queryClient.getQueryData<T>(detailKey);
      const previousList = updateInListOptimistic<T>(queryClient, listQueryKey, id, updates);

      // Update detail cache
      if (previousDetail) {
        queryClient.setQueryData<T>(detailKey, {
          ...previousDetail,
          ...updates,
          updatedAt: new Date(),
        });
      }

      return { previousDetail, previousList };
    },

    /**
     * Confirm an optimistic update with server response.
     */
    confirmOptimistic: (confirmedItem: T) => {
      const detailKey = getDetailKey(confirmedItem.id);
      queryClient.setQueryData(detailKey, confirmedItem);

      // Update in list as well
      const currentList = queryClient.getQueryData<PaginatedResponse<T>>(listQueryKey);
      if (currentList) {
        queryClient.setQueryData<PaginatedResponse<T>>(listQueryKey, {
          ...currentList,
          items: currentList.items.map((item) =>
            item.id === confirmedItem.id ? confirmedItem : item
          ),
        });
      }
    },

    /**
     * Rollback an optimistic update by restoring previous states.
     */
    rollback: (
      id: string,
      previousDetail: T | undefined,
      previousList: PaginatedResponse<T> | undefined
    ) => {
      const detailKey = getDetailKey(id);
      rollbackOptimistic(queryClient, detailKey, previousDetail);
      rollbackOptimistic(queryClient, listQueryKey, previousList);
    },
  };
}

/**
 * Hook for optimistically deleting items from cache.
 * Returns utilities for removing, confirming, and rolling back optimistic deletes.
 */
export function useOptimisticDelete<T extends { id: string }>(
  listQueryKey: readonly unknown[],
  getDetailKey: (id: string) => readonly unknown[]
) {
  const queryClient = useQueryClient();

  return {
    /**
     * Remove an item optimistically from both list and detail caches.
     * Returns previous states for rollback.
     */
    deleteOptimistic: (id: string) => {
      const detailKey = getDetailKey(id);

      // Get previous states
      const previousDetail = queryClient.getQueryData<T>(detailKey);
      const previousList = removeFromListOptimistic<T>(queryClient, listQueryKey, id);

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: detailKey });

      return { previousDetail, previousList };
    },

    /**
     * Rollback an optimistic delete by restoring previous states.
     */
    rollback: (
      id: string,
      previousDetail: T | undefined,
      previousList: PaginatedResponse<T> | undefined
    ) => {
      const detailKey = getDetailKey(id);
      if (previousDetail) {
        queryClient.setQueryData(detailKey, previousDetail);
      }
      rollbackOptimistic(queryClient, listQueryKey, previousList);
    },
  };
}

// ============================================================
// API CLIENT CLASS
// ============================================================

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Generic fetch wrapper with error handling, retries, and type safety.
   */
  async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: ApiClientError | null = null;
    const maxRetries = this.config.retryCount ?? 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const headers = new Headers(options.headers);
        headers.set('Content-Type', 'application/json');

        // Add authorization header if token is available
        if (this.config.getToken) {
          const token = await this.config.getToken();
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        }

        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle unauthorized
        if (response.status === 401) {
          this.config.onUnauthorized?.();
          return {
            success: false,
            error: {
              type: 'unauthorized',
              message: 'Authentication required',
            },
          };
        }

        // Handle forbidden
        if (response.status === 403) {
          return {
            success: false,
            error: {
              type: 'forbidden',
              message: 'Access denied',
            },
          };
        }

        // Handle not found
        if (response.status === 404) {
          return {
            success: false,
            error: {
              type: 'not_found',
              message: 'Resource not found',
            },
          };
        }

        // Parse response
        const data = await response.json() as ApiResponse<T>;
        return data;
      } catch (error) {
        lastError = {
          code: 'network_error',
          message: error instanceof Error ? error.message : 'Network request failed',
        };

        // Only retry on network errors, not on HTTP errors
        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay ?? 1000);
          continue;
        }
      }
    }

    return {
      success: false,
      error: {
        type: lastError?.code ?? 'unknown',
        message: lastError?.message ?? 'Request failed',
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- HTTP Method Helpers ---

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient(clientConfig);

// ============================================================
// QUERY KEY FACTORIES
// ============================================================


// ============================================================
// API FUNCTIONS
// ============================================================


// ============================================================
// REACT QUERY HOOKS
// ============================================================


// ============================================================
// PREFETCH UTILITIES
// ============================================================


// ============================================================
// CACHE MANIPULATION UTILITIES
// ============================================================


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
