// ============================================================
// VALIDATION SCHEMAS - myTrimmy-prep
// Generated: 2026-01-14
// ============================================================
//
// ZOD-BASED VALIDATION: Runtime type checking with rich error messages.
// Every input is validated BEFORE entering business logic.
// Invalid data is rejected at the boundary, not deep in the system.
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What could go wrong? → Reject invalid data at the boundary
// - What would cause users to abandon? → Clear error messages
// - What would make this unmaintainable? → Consistent validation
//
// ============================================================

import { z } from "zod";
import {
  type ValidationResult,
  type ValidationError,
  ok,
  err,
} from "@/types/errors";
import type {
} from "@/types/domain";

// ============================================================
// DEFENSIVE LIMITS (Inversion: "What could go wrong?")
// ============================================================

/**
 * DEFENSIVE: Maximum depth for nested object validation.
 * Prevents stack overflow from deeply nested malicious payloads.
 */
const MAX_OBJECT_DEPTH = 10;

/**
 * DEFENSIVE: Maximum items in batch operations.
 * Prevents array bomb attacks and memory exhaustion.
 */
const MAX_BATCH_SIZE = 100;

/**
 * DEFENSIVE: Maximum string length for general text fields.
 * Prevents memory exhaustion from large payloads.
 */
const MAX_STRING_LENGTH = 10_000;

/**
 * DEFENSIVE: Maximum field name length.
 * Prevents injection attacks via field names.
 */
const MAX_FIELD_NAME_LENGTH = 64;

/**
 * DEFENSIVE: Safe field name pattern.
 * Only allows alphanumeric, underscore, and dot (for nested paths).
 */
const SAFE_FIELD_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

// ============================================================
// COMMON VALIDATION PATTERNS
// ============================================================

const nonEmptyString = (fieldName: string, minLength = 1, maxLength = 255) =>
  z
    .string()
    .min(minLength, `${fieldName} must be at least ${minLength} characters`)
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`);

/**
 * DEFENSIVE: Large text field with explicit max length.
 * Use for description, content, notes fields.
 */
const textField = (fieldName: string, maxLength = MAX_STRING_LENGTH) =>
  z
    .string()
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`);

const emailSchema = z
  .string()
  .email("Must be a valid email address")
  .max(255, "Email must be at most 255 characters")
  .transform((email) => email.toLowerCase().trim()); // DEFENSIVE: Normalize

const uuidSchema = z.string().uuid("Must be a valid UUID");

const positiveNumber = (fieldName: string) =>
  z.number().positive(`${fieldName} must be a positive number`);

const nonNegativeNumber = (fieldName: string) =>
  z.number().nonnegative(`${fieldName} cannot be negative`);

/**
 * DEFENSIVE: Safe integer with bounds.
 * Prevents integer overflow attacks.
 */
const safeInteger = (fieldName: string, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) =>
  z
    .number()
    .int(`${fieldName} must be an integer`)
    .min(min, `${fieldName} must be at least ${min}`)
    .max(max, `${fieldName} must be at most ${max}`);

const dateSchema = z.coerce.date();

const booleanSchema = z.boolean();

/**
 * DEFENSIVE: URL validation with protocol restriction.
 * Prevents javascript: and data: URL injection.
 */
const safeUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => url.startsWith("https://") || url.startsWith("http://"),
    "URL must use http or https protocol"
  );

// ============================================================
// ZOD ERROR TO VALIDATION ERROR CONVERTER
// ============================================================

const zodToValidationErrors = (error: z.ZodError): ValidationError[] =>
  error.errors.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
    code: mapZodCodeToValidationCode(issue.code),
  }));

const mapZodCodeToValidationCode = (
  zodCode: z.ZodIssueCode
): ValidationError["code"] => {
  switch (zodCode) {
    case "invalid_type":
      return "invalid_format";
    case "too_small":
      return "too_short";
    case "too_big":
      return "too_long";
    case "invalid_string":
      return "invalid_format";
    case "custom":
      return "invalid_state";
    default:
      return "invalid_format";
  }
};

// ============================================================
// VALIDATION WRAPPER
// ============================================================

const validate = <T>(
  schema: z.ZodType<T>,
  input: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(input);
  if (result.success) {
    return ok(result.data);
  }
  return err(zodToValidationErrors(result.error));
};

// ============================================================
// ENTITY VALIDATION SCHEMAS
// ============================================================


// ============================================================
// ID VALIDATION
// ============================================================


// ============================================================
// BATCH VALIDATION HELPERS (with Defensive Limits)
// ============================================================

/**
 * DEFENSIVE: Validate an array of items with size limit.
 * Prevents array bomb attacks and memory exhaustion.
 *
 * @param maxItems - Maximum allowed items (default: MAX_BATCH_SIZE)
 */
export const validateArray = <T>(
  schema: z.ZodType<T>,
  items: unknown[],
  maxItems: number = MAX_BATCH_SIZE
): ValidationResult<T[]> => {
  // DEFENSIVE: Check array size before processing
  if (!Array.isArray(items)) {
    return err([{ field: "root", message: "Expected an array", code: "invalid_format" }]);
  }

  if (items.length > maxItems) {
    return err([{
      field: "root",
      message: `Batch size ${items.length} exceeds maximum of ${maxItems}`,
      code: "too_long",
    }]);
  }

  const results: T[] = [];
  const allErrors: ValidationError[] = [];

  items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      results.push(result.data);
    } else {
      const indexedErrors = zodToValidationErrors(result.error).map((e) => ({
        ...e,
        field: `[${index}].${e.field}`,
      }));
      allErrors.push(...indexedErrors);
    }
  });

  if (allErrors.length > 0) {
    return err(allErrors);
  }
  return ok(results);
};

/**
 * DEFENSIVE: Validate field name is safe for use in queries.
 * Prevents injection attacks via field names in dynamic queries.
 */
export const validateFieldName = (fieldName: string): ValidationResult<string> => {
  if (!fieldName || typeof fieldName !== "string") {
    return err([{ field: "fieldName", message: "Field name is required", code: "required" }]);
  }

  if (fieldName.length > MAX_FIELD_NAME_LENGTH) {
    return err([{
      field: "fieldName",
      message: `Field name exceeds maximum length of ${MAX_FIELD_NAME_LENGTH}`,
      code: "too_long",
    }]);
  }

  if (!SAFE_FIELD_NAME_PATTERN.test(fieldName)) {
    return err([{
      field: "fieldName",
      message: "Field name contains invalid characters",
      code: "invalid_format",
    }]);
  }

  return ok(fieldName);
};

/**
 * DEFENSIVE: Validate sort/order parameters.
 * Prevents SQL injection via ORDER BY clauses.
 */
export const validateSortParams = <T extends string>(
  orderBy: unknown,
  orderDir: unknown,
  allowedFields: readonly T[]
): ValidationResult<{ orderBy?: T; orderDir?: "asc" | "desc" }> => {
  const result: { orderBy?: T; orderDir?: "asc" | "desc" } = {};

  if (orderBy !== undefined) {
    if (typeof orderBy !== "string") {
      return err([{ field: "orderBy", message: "orderBy must be a string", code: "invalid_format" }]);
    }
    if (!allowedFields.includes(orderBy as T)) {
      return err([{
        field: "orderBy",
        message: `orderBy must be one of: ${allowedFields.join(", ")}`,
        code: "invalid_format",
      }]);
    }
    result.orderBy = orderBy as T;
  }

  if (orderDir !== undefined) {
    if (orderDir !== "asc" && orderDir !== "desc") {
      return err([{
        field: "orderDir",
        message: "orderDir must be 'asc' or 'desc'",
        code: "invalid_format",
      }]);
    }
    result.orderDir = orderDir;
  }

  return ok(result);
};

/**
 * DEFENSIVE: Validate pagination parameters with bounds.
 * Prevents resource exhaustion via extreme pagination.
 */
export const validatePagination = (
  limit: unknown,
  offset: unknown,
  maxLimit: number = 100,
  maxOffset: number = 1_000_000
): ValidationResult<{ limit: number; offset: number }> => {
  const limitNum = typeof limit === "number" ? limit : typeof limit === "string" ? parseInt(limit, 10) : 20;
  const offsetNum = typeof offset === "number" ? offset : typeof offset === "string" ? parseInt(offset, 10) : 0;

  if (isNaN(limitNum) || limitNum < 1) {
    return err([{ field: "limit", message: "limit must be a positive integer", code: "out_of_range" }]);
  }

  if (limitNum > maxLimit) {
    return err([{ field: "limit", message: `limit cannot exceed ${maxLimit}`, code: "too_long" }]);
  }

  if (isNaN(offsetNum) || offsetNum < 0) {
    return err([{ field: "offset", message: "offset must be a non-negative integer", code: "out_of_range" }]);
  }

  if (offsetNum > maxOffset) {
    return err([{ field: "offset", message: `offset cannot exceed ${maxOffset}`, code: "too_long" }]);
  }

  return ok({ limit: limitNum, offset: offsetNum });
};

// ============================================================
// FIELD TYPE MAPPING (Applied Inline in Schemas)
// ============================================================
// Field types are mapped to Zod schemas with constraints:
//
// string      -> z.string() with minLength/maxLength
// string+enum -> z.enum([...values])
// email       -> emailSchema (normalized)
// url         -> safeUrlSchema (protocol validation)
// number      -> z.number() with min/max
// boolean     -> booleanSchema
// date/Date   -> dateSchema (coerced)
// uuid        -> uuidSchema
// json/jsonb  -> z.record(z.unknown())
// array       -> z.array(...)
//
// Constraints from entity definition:
// - constraints.minLength/maxLength -> string bounds
// - constraints.min/max -> number bounds
// - constraints.enum -> z.enum([...])
// - constraints.pattern -> z.regex(...) [future]
//
// ============================================================

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
