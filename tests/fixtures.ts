// ============================================================
// TEST FIXTURES - myTrimmy-prep
// Generated: 2026-01-14
// ============================================================
//
// EXPORTABLE TEST FIXTURES: Import these into your test files.
//
// Usage:
//   import { fixtures, factories } from '@/tests/fixtures';
//
//   // Use pre-defined fixtures
//   const user = fixtures.users.admin;
//
//   // Use factories to create custom fixtures
//   const task = factories.task({ title: 'Custom Title' });
//
// ============================================================

import { expect } from "vitest";
import type { Database } from "@/types/database";

// Type aliases for database tables
type Tables = Database["public"]["Tables"];

// ============================================================
// TEST USER FIXTURES
// ============================================================

export interface TestUser {
  email: string;
  password: string;
  metadata: {
    full_name: string;
    role: "admin" | "user";
  };
}

/**
 * Pre-defined test users for authentication testing.
 * These match the seed data credentials.
 */
export const testUsers = {
  admin: {
    email: "admin@example.com",
    password: "testpassword123",
    metadata: { full_name: "Admin User", role: "admin" as const },
  },
  user: {
    email: "user@example.com",
    password: "testpassword123",
    metadata: { full_name: "Test User", role: "user" as const },
  },
  demo: {
    email: "demo@example.com",
    password: "testpassword123",
    metadata: { full_name: "Demo User", role: "user" as const },
  },
} as const satisfies Record<string, TestUser>;

// ============================================================
// ENTITY FIXTURE TYPES
// ============================================================


// ============================================================
// FACTORY FUNCTIONS
// ============================================================

/**
 * Creates a unique string with optional prefix for testing.
 * Uses timestamp + random to ensure uniqueness across test runs.
 */
function uniqueString(prefix = "test"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Creates a unique email address for testing.
 */
function uniqueEmail(prefix = "test"): string {
  return `${uniqueString(prefix)}@example.com`;
}

/**
 * Creates a unique slug for testing.
 */
function uniqueSlug(prefix = "test"): string {
  return uniqueString(prefix).toLowerCase().replace(/_/g, "-");
}

/**
 * Creates a random integer between min and max (inclusive).
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates a random price/amount with 2 decimal places.
 */
function randomPrice(min = 10, max = 500): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Creates a random date within the last N days.
 */
function randomRecentDate(daysAgo = 30): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}


// ============================================================
// PRE-DEFINED FIXTURES
// ============================================================

/**
 * Pre-defined fixtures for common test scenarios.
 * Use these for consistent test data across test files.
 */
export const fixtures = {
  users: testUsers,

};

// ============================================================
// FACTORY REGISTRY
// ============================================================

/**
 * Factory functions for creating entity fixtures.
 * Use these when you need multiple unique instances or custom overrides.
 */
export const factories = {
};

// ============================================================
// BATCH CREATION HELPERS
// ============================================================

/**
 * Creates multiple fixtures of the same type.
 */
export function createMany<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides?: Partial<T>
): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}


// ============================================================
// TEST DATA VALIDATION HELPERS
// ============================================================

/**
 * Validates that a value matches the expected fixture shape.
 * Useful for asserting API responses match expected structure.
 */
export function expectShape<T extends object>(
  actual: unknown,
  expected: T
): void {
  const actualObj = actual as Record<string, unknown>;
  for (const key of Object.keys(expected)) {
    if (expected[key as keyof T] !== undefined) {
      expect(actualObj).toHaveProperty(key);
    }
  }
}

/**
 * Validates that a response contains the expected ID.
 */
export function expectId(response: unknown): string {
  const obj = response as { id?: string };
  expect(obj).toHaveProperty("id");
  expect(typeof obj.id).toBe("string");
  expect(obj.id!.length).toBeGreaterThan(0);
  return obj.id!;
}

/**
 * Validates that timestamps are present and valid.
 */
export function expectTimestamps(
  response: unknown,
  options: { hasUpdatedAt?: boolean } = {}
): void {
  const obj = response as { created_at?: string; updated_at?: string };
  expect(obj).toHaveProperty("created_at");
  expect(new Date(obj.created_at!).getTime()).toBeGreaterThan(0);

  if (options.hasUpdatedAt !== false) {
    expect(obj).toHaveProperty("updated_at");
    expect(new Date(obj.updated_at!).getTime()).toBeGreaterThan(0);
  }
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
