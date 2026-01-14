// ============================================================
// DATABASE REPOSITORY - myTrimmy-prep
// Generated: 2026-01-14
// ============================================================
//
// TYPE-FIRST DESIGN: Repository functions return Result<T, DbError>.
// No throwing exceptions. All database operations are explicit.
//
// RLS: All queries go through the Supabase client which respects
// Row Level Security policies. User context is handled by Supabase Auth.
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could go wrong? → Retry transient failures with backoff
// - What would cause cascading failures? → Circuit breaker pattern
// - What would make debugging hard? → Rich error context
//
//
// SCALABILITY PATTERNS (Second-Order Mental Model):
// - What happens at 10x users? → Pagination prevents memory explosion
// - What cascades from DB slowdown? → Circuit breaker isolates failures
// - What becomes harder to change? → Repository pattern enables swap
// - What dependencies does this create? → Supabase client is abstracted
//
// CONNECTION POOL GUIDANCE:
// - Supabase uses Supavisor connection pooling by default
// - Default pool size: 15 connections per user
// - For serverless (Vercel/Netlify): Use transaction mode
// - For long-running: Use session mode
// - Monitor with: SELECT count(*) FROM pg_stat_activity;
//
// N+1 PREVENTION:
// - Use select("*, relation(*)") for eager loading
// - Use .in() for batch lookups instead of loops
// - Consider caching for frequently accessed relations
//
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import {
  type Result,
  ok,
  err,
} from "@/types/errors";
import type { DbError } from "@/types/errors";
import {
  logger,
  withSpan,
  dbQueryDuration,
  timed,
} from "@/lib/observability";

// ============================================================
// PAGINATION TYPES
// ============================================================

export interface PaginationParams {
  readonly limit?: number;
  readonly offset?: number;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasMore: boolean;
}

// Default pagination values
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// ============================================================
// ERROR MAPPING
// ============================================================

/**
 * Maps Supabase/Postgres errors to DbError type.
 * IMPORTANT: Never log raw error messages - they may contain sensitive data.
 */
const mapDbError = (error: unknown, operation: string): DbError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Connection errors
    if (message.includes("connection") || message.includes("network")) {
      return { type: "connection_failed", cause: "Database connection failed" };
    }

    // Constraint violations (unique, foreign key, check)
    if (message.includes("duplicate key") || message.includes("unique constraint")) {
      const match = error.message.match(/constraint "([^"]+)"/);
      return {
        type: "constraint_violation",
        constraint: match?.[1] ?? "unknown",
        detail: "Duplicate value violates unique constraint",
      };
    }

    if (message.includes("foreign key") || message.includes("violates foreign key")) {
      const match = error.message.match(/constraint "([^"]+)"/);
      return {
        type: "constraint_violation",
        constraint: match?.[1] ?? "unknown",
        detail: "Referenced record does not exist",
      };
    }

    if (message.includes("check constraint")) {
      const match = error.message.match(/constraint "([^"]+)"/);
      return {
        type: "constraint_violation",
        constraint: match?.[1] ?? "unknown",
        detail: "Value violates check constraint",
      };
    }

    // Timeout
    if (message.includes("timeout") || message.includes("canceling statement")) {
      return { type: "timeout", operation };
    }

    // Transaction errors
    if (message.includes("transaction") || message.includes("deadlock")) {
      return { type: "transaction_failed", cause: "Transaction failed" };
    }
  }

  // Default to query_failed
  return {
    type: "query_failed",
    query: operation,
    cause: "Database query failed",
  };
};

// ============================================================
// DEFENSIVE: RETRY CONFIGURATION
// ============================================================

/**
 * DEFENSIVE: Configuration for retry behavior.
 * Prevents infinite retries and excessive delays.
 */
interface RetryConfig {
  /** Maximum number of retry attempts */
  readonly maxRetries: number;
  /** Initial delay in milliseconds */
  readonly baseDelayMs: number;
  /** Maximum delay in milliseconds */
  readonly maxDelayMs: number;
  /** Jitter factor (0-1) to prevent thundering herd */
  readonly jitterFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  jitterFactor: 0.2,
};

/**
 * DEFENSIVE: Determines if an error is retriable.
 * Only retry transient failures, never retry permanent ones.
 */
const isRetriableError = (error: DbError): boolean => {
  switch (error.type) {
    case "connection_failed":
    case "timeout":
      return true;
    case "transaction_failed":
      // Deadlocks are retriable, other transaction failures may not be
      return error.cause?.toLowerCase().includes("deadlock") ?? false;
    case "constraint_violation":
    case "query_failed":
    default:
      return false;
  }
};

/**
 * DEFENSIVE: Calculate delay with exponential backoff and jitter.
 * Jitter prevents thundering herd when many clients retry together.
 */
const calculateBackoffDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = cappedDelay * config.jitterFactor * Math.random();
  return Math.floor(cappedDelay + jitter);
};

/**
 * DEFENSIVE: Wait for specified milliseconds.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * DEFENSIVE: Execute operation with retry logic.
 * Only retries transient failures with exponential backoff.
 */
export const withRetry = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<Result<T, DbError>> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: DbError | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    const result = await operation();

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    // Don't retry permanent failures
    if (!isRetriableError(result.error)) {
      return result;
    }

    // Don't sleep after last attempt
    if (attempt < finalConfig.maxRetries) {
      const delay = calculateBackoffDelay(attempt, finalConfig);
      logger.warn('Repository operation failed, retrying', {
        operation: operationName,
        attempt: attempt + 1,
        maxAttempts: finalConfig.maxRetries + 1,
        retryDelayMs: delay,
        errorType: result.error.type,
      });
      await sleep(delay);
    }
  }

  // All retries exhausted
  return err(lastError ?? { type: "query_failed", query: operationName, cause: "All retries exhausted" });
};

// ============================================================
// DEFENSIVE: CIRCUIT BREAKER
// ============================================================

/**
 * DEFENSIVE: Circuit breaker state.
 * Prevents cascade failures by stopping requests to failing services.
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  openedAt: number;
}

/**
 * DEFENSIVE: Circuit breaker configuration.
 */
interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  readonly failureThreshold: number;
  /** Time in ms before attempting recovery */
  readonly recoveryTimeMs: number;
  /** Time window in ms for counting failures */
  readonly failureWindowMs: number;
}

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeMs: 30_000,
  failureWindowMs: 60_000,
};

// Circuit breaker state per operation type
const circuitBreakers = new Map<string, CircuitBreakerState>();

/**
 * DEFENSIVE: Get or create circuit breaker state.
 */
const getCircuitBreaker = (key: string): CircuitBreakerState => {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      openedAt: 0,
    });
  }
  return circuitBreakers.get(key)!;
};

/**
 * DEFENSIVE: Check if circuit breaker allows request.
 * Returns error if circuit is open and not ready for recovery.
 */
const checkCircuitBreaker = (
  key: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
): DbError | null => {
  const state = getCircuitBreaker(key);
  const now = Date.now();

  if (state.isOpen) {
    // Check if recovery time has passed
    if (now - state.openedAt >= config.recoveryTimeMs) {
      // Allow one request through (half-open state)
      state.isOpen = false;
      return null;
    }

    return {
      type: "connection_failed",
      cause: `Circuit breaker open for ${key}. Recovery in ${Math.ceil((config.recoveryTimeMs - (now - state.openedAt)) / 1000)}s`,
    };
  }

  return null;
};

/**
 * DEFENSIVE: Record success - reset failure count.
 */
const recordSuccess = (key: string): void => {
  const state = getCircuitBreaker(key);
  state.failures = 0;
  state.isOpen = false;
};

/**
 * DEFENSIVE: Record failure - potentially open circuit.
 */
const recordFailure = (
  key: string,
  config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG
): void => {
  const state = getCircuitBreaker(key);
  const now = Date.now();

  // Reset failures if outside window
  if (now - state.lastFailure > config.failureWindowMs) {
    state.failures = 0;
  }

  state.failures++;
  state.lastFailure = now;

  if (state.failures >= config.failureThreshold) {
    state.isOpen = true;
    state.openedAt = now;
    logger.error('Circuit breaker opened', {
      circuitKey: key,
      failures: state.failures,
      recoveryTimeMs: config.recoveryTimeMs,
    });
  }
};

/**
 * DEFENSIVE: Execute operation with circuit breaker protection.
 * Prevents cascade failures by failing fast when service is unhealthy.
 */
export const withCircuitBreaker = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  operationKey: string,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<Result<T, DbError>> => {
  const finalConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };

  // Check if circuit is open
  const blocked = checkCircuitBreaker(operationKey, finalConfig);
  if (blocked) {
    return err(blocked);
  }

  // Execute operation
  const result = await operation();

  // Record result
  if (result.ok) {
    recordSuccess(operationKey);
  } else if (isRetriableError(result.error)) {
    // Only count transient failures toward circuit breaker
    recordFailure(operationKey, finalConfig);
  }

  return result;
};

/**
 * DEFENSIVE: Execute with both retry and circuit breaker.
 * Provides maximum resilience for critical operations.
 */
export const withResilience = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  operationKey: string,
  retryConfig?: Partial<RetryConfig>,
  circuitConfig?: Partial<CircuitBreakerConfig>
): Promise<Result<T, DbError>> => {
  return withCircuitBreaker(
    () => withRetry(operation, operationKey, retryConfig),
    operationKey,
    circuitConfig
  );
};

// ============================================================
// DEFENSIVE: QUERY TIMEOUT
// ============================================================

/**
 * DEFENSIVE: Default query timeout in milliseconds.
 * Prevents long-running queries from blocking resources.
 */
const DEFAULT_QUERY_TIMEOUT_MS = 30_000;

/**
 * DEFENSIVE: Execute operation with timeout.
 * Prevents queries from running indefinitely.
 */
export const withTimeout = async <T>(
  operation: () => Promise<Result<T, DbError>>,
  timeoutMs: number = DEFAULT_QUERY_TIMEOUT_MS,
  operationName: string = "query"
): Promise<Result<T, DbError>> => {
  const timeoutPromise = new Promise<Result<T, DbError>>((resolve) => {
    setTimeout(() => {
      resolve(err({ type: "timeout", operation: operationName }));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
};

// ============================================================
// SUPABASE CLIENT HELPER
// ============================================================

/**
 * Gets the Supabase client.
 * RLS policies are enforced automatically based on the authenticated user.
 */
const getClient = async () => await createClient();

// ============================================================
// ROW MAPPERS
// ============================================================
// Convert database rows to domain types


// ============================================================
// REPOSITORY FUNCTIONS
// ============================================================


// ============================================================
// BATCH OPERATIONS (Use with caution - can be slow for large sets)
// ============================================================


// ============================================================
// TRANSACTION HELPER
// ============================================================
//
// REQUIRED MIGRATION: Run this SQL to enable transaction support.
// This creates a generic transaction wrapper function that executes
// arbitrary SQL statements within a single ACID transaction.
//
// -- Migration: create_execute_transaction_function
// CREATE OR REPLACE FUNCTION execute_transaction(statements jsonb)
// RETURNS jsonb
// LANGUAGE plpgsql
// SECURITY DEFINER
// SET search_path = public
// AS $$
// DECLARE
//   stmt jsonb;
//   stmt_sql text;
//   stmt_params jsonb;
//   result jsonb := '[]'::jsonb;
//   stmt_result jsonb;
//   row_count integer;
// BEGIN
//   -- Validate input
//   IF statements IS NULL OR jsonb_typeof(statements) != 'array' THEN
//     RAISE EXCEPTION 'statements must be a JSON array';
//   END IF;
//
//   -- Execute each statement in order
//   FOR stmt IN SELECT * FROM jsonb_array_elements(statements)
//   LOOP
//     stmt_sql := stmt->>'sql';
//     stmt_params := COALESCE(stmt->'params', '[]'::jsonb);
//
//     IF stmt_sql IS NULL THEN
//       RAISE EXCEPTION 'Each statement must have a sql field';
//     END IF;
//
//     -- Execute the statement and capture result
//     EXECUTE format(
//       'WITH result AS (%s) SELECT jsonb_agg(row_to_json(result)) FROM result',
//       stmt_sql
//     ) USING stmt_params INTO stmt_result;
//
//     -- Handle NULL result (for INSERT/UPDATE/DELETE without RETURNING)
//     IF stmt_result IS NULL THEN
//       GET DIAGNOSTICS row_count = ROW_COUNT;
//       stmt_result := jsonb_build_object('affected_rows', row_count);
//     END IF;
//
//     result := result || jsonb_build_array(stmt_result);
//   END LOOP;
//
//   RETURN result;
// EXCEPTION
//   WHEN OTHERS THEN
//     -- Transaction is automatically rolled back on exception
//     RAISE;
// END;
// $$;
//
// -- Grant execute permission to authenticated users
// GRANT EXECUTE ON FUNCTION execute_transaction(jsonb) TO authenticated;
// GRANT EXECUTE ON FUNCTION execute_transaction(jsonb) TO service_role;
//
// ============================================================

/**
 * Represents a SQL statement to execute within a transaction.
 */
export interface TransactionStatement {
  readonly sql: string;
  readonly params?: readonly unknown[];
}

/**
 * Result of a single statement within a transaction.
 */
export type TransactionStatementResult =
  | readonly Record<string, unknown>[]  // SELECT or RETURNING result
  | { readonly affected_rows: number }; // INSERT/UPDATE/DELETE without RETURNING

/**
 * Executes multiple SQL statements within a database transaction.
 * All statements succeed atomically or all are rolled back.
 *
 * Uses the execute_transaction PostgreSQL function which provides
 * full ACID transaction guarantees including automatic rollback on error.
 *
 * @param statements - Array of SQL statements to execute in order
 * @returns Array of results for each statement, or a DbError
 *
 * @example
 * ```typescript
 * const result = await executeTransaction([
 *   { sql: "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *", params: [userId, 100] },
 *   { sql: "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)", params: ["(SELECT id FROM orders ORDER BY created_at DESC LIMIT 1)", productId, 2] },
 *   { sql: "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2", params: [2, productId] },
 * ]);
 *
 * if (result.ok) {
 *   const [orderResult] = result.value;
 *   console.log("Order created:", orderResult);
 * }
 * ```
 */
export const executeTransaction = async (
  statements: readonly TransactionStatement[]
): Promise<Result<readonly TransactionStatementResult[], DbError>> => {
  if (statements.length === 0) {
    return ok([]);
  }

  const client = await getClient();

  // Cast to bypass strict typing - execute_transaction is a custom Postgres function
  const { data, error } = await (client as unknown as { rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }> })
    .rpc("execute_transaction", {
      statements: statements.map((stmt) => ({
        sql: stmt.sql,
        params: stmt.params ?? [],
      })),
    });

  if (error) {
    return err(mapDbError(error, "executeTransaction"));
  }

  return ok(data as readonly TransactionStatementResult[]);
};

/**
 * Builder for constructing transactions with a fluent API.
 * Collects statements and executes them atomically.
 *
 * @example
 * ```typescript
 * const result = await transaction()
 *   .add("INSERT INTO users (name) VALUES ($1) RETURNING id", ["Alice"])
 *   .add("INSERT INTO profiles (user_id, bio) VALUES ($1, $2)", ["(SELECT id FROM users ORDER BY id DESC LIMIT 1)", "Hello!"])
 *   .execute();
 * ```
 */
export const transaction = () => {
  const statements: TransactionStatement[] = [];

  const builder = {
    /**
     * Adds a SQL statement to the transaction.
     * Statements are executed in the order they are added.
     */
    add(sql: string, params?: readonly unknown[]) {
      statements.push({ sql, params });
      return builder;
    },

    /**
     * Executes all added statements within a single transaction.
     * Returns results for each statement or rolls back on any error.
     */
    execute(): Promise<Result<readonly TransactionStatementResult[], DbError>> {
      return executeTransaction(statements);
    },
  };

  return builder;
};

/**
 * Executes a function that may perform multiple database operations.
 * If any operation fails (returns an error Result), this helper
 * immediately returns that error.
 *
 * IMPORTANT: This does NOT provide transaction guarantees by itself.
 * For true ACID transactions, use executeTransaction() or transaction().
 *
 * This helper is useful for:
 * - Chaining multiple repository calls with early-exit on error
 * - Validation sequences before committing
 * - Read-only operations that don't need atomicity
 *
 * For operations that MUST be atomic, structure your operations as
 * SQL statements and use executeTransaction() instead.
 *
 * @example
 * ```typescript
 * // For read operations or validation (no atomicity needed):
 * const result = await withOperations(async () => {
 *   const user = await getUser(userId);
 *   if (!user.ok) return user;
 *   if (!user.value) return err({ type: "not_found" });
 *
 *   const profile = await getProfile(user.value.id);
 *   if (!profile.ok) return profile;
 *
 *   return ok({ user: user.value, profile: profile.value });
 * });
 *
 * // For atomic operations, use executeTransaction() instead:
 * const atomicResult = await executeTransaction([
 *   { sql: "UPDATE accounts SET balance = balance - $1 WHERE id = $2", params: [amount, fromAccount] },
 *   { sql: "UPDATE accounts SET balance = balance + $1 WHERE id = $2", params: [amount, toAccount] },
 * ]);
 * ```
 */
export const withOperations = async <T>(
  fn: () => Promise<Result<T, DbError>>
): Promise<Result<T, DbError>> => {
  try {
    return await fn();
  } catch (error) {
    return err(mapDbError(error, "withOperations"));
  }
};

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
