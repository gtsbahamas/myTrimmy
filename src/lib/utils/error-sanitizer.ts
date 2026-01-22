// src/lib/utils/error-sanitizer.ts

/**
 * Sanitize error messages to prevent sensitive data leakage
 */

// Patterns that might contain sensitive data
const SENSITIVE_PATTERNS = [
  // API keys
  /sk[-_][a-zA-Z0-9]{20,}/g,
  /fal[-_][a-zA-Z0-9]{20,}/g,
  /key[-_][a-zA-Z0-9]{20,}/gi,
  /api[-_]?key[=:]\s*[a-zA-Z0-9_-]+/gi,

  // Tokens and secrets
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /token[=:]\s*[a-zA-Z0-9._-]+/gi,
  /secret[=:]\s*[a-zA-Z0-9._-]+/gi,
  /password[=:]\s*[^\s]+/gi,

  // Connection strings
  /postgres:\/\/[^\s]+/gi,
  /mongodb:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,

  // Email addresses in error context
  /[\w.-]+@[\w.-]+\.\w+/g,

  // IPs (might be internal)
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
];

// Safe replacement text
const REDACTED = '[REDACTED]';

/**
 * Sanitize an error message for client display
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, REDACTED);
  }

  return sanitized;
}

/**
 * Sanitize an error object for logging
 * Keeps full detail but marks sensitive parts
 */
export function sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
    };
  }

  if (typeof error === 'string') {
    return { message: sanitizeErrorMessage(error) };
  }

  if (typeof error === 'object' && error !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(error)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeErrorMessage(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return { message: 'Unknown error' };
}

/**
 * Create a safe public error from an internal error
 */
export function toPublicError(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred'
): { message: string; code?: string } {
  if (error instanceof Error) {
    // Check if it's already a public error type
    if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
      return {
        message: sanitizeErrorMessage(error.message),
        code: (error as { code: string }).code,
      };
    }

    // Generic error - use fallback
    return { message: fallbackMessage };
  }

  return { message: fallbackMessage };
}
