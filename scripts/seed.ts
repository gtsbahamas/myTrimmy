// ============================================================
// DATABASE SEED DATA - myTrimmy-prep
// Generated: 2026-01-14
// ============================================================
//
// SEED SCRIPT: Populates the database with test/development data.
//
// IMPORTANT:
// - Only run in development environment (enforced)
// - Uses service role key to bypass RLS
// - Idempotent: checks for existing data before inserting
//
// Usage:
//   npx tsx scripts/seed.ts seed      # Seed the database
//   npx tsx scripts/seed.ts reset     # Clear all data
//   npx tsx scripts/seed.ts seed-dev  # Reset + seed (full refresh)
//
// ============================================================

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Type alias for Supabase table insert/row types
type Tables = Database["public"]["Tables"];

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NODE_ENV = process.env.NODE_ENV;

if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

// CRITICAL: Only allow seeding in development
const isProduction = NODE_ENV === "production";
const isExplicitlyAllowed = process.env.ALLOW_SEED_IN_PRODUCTION === "true";

if (isProduction && !isExplicitlyAllowed) {
  console.error("ERROR: Cannot run seed script in production environment.");
  console.error("If you really need to seed production, set ALLOW_SEED_IN_PRODUCTION=true");
  process.exit(1);
}

// ============================================================
// SUPABASE CLIENT (Service Role - Bypasses RLS)
// ============================================================

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// SEED DATA DEFINITIONS
// ============================================================

// Test users for development
const TEST_USERS = [
  {
    email: "admin@example.com",
    password: "testpassword123",
    user_metadata: { full_name: "Admin User", role: "admin" },
  },
  {
    email: "user@example.com",
    password: "testpassword123",
    user_metadata: { full_name: "Test User", role: "user" },
  },
  {
    email: "demo@example.com",
    password: "testpassword123",
    user_metadata: { full_name: "Demo User", role: "user" },
  },
] as const;


// ============================================================
// SEED FUNCTIONS
// ============================================================

/**
 * Creates test users in auth.users.
 * Uses Supabase Admin API to create users with known passwords.
 */
async function seedTestUsers(): Promise<Map<string, string>> {
  console.log("\n--- Seeding Test Users ---");
  const userIdMap = new Map<string, string>();

  for (const userData of TEST_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      (u) => u.email === userData.email
    );

    if (existingUser) {
      console.log(`  [SKIP] User already exists: ${userData.email}`);
      userIdMap.set(userData.email, existingUser.id);
      continue;
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userData.user_metadata,
    });

    if (error) {
      console.error(`  [ERROR] Failed to create user ${userData.email}:`, error.message);
      continue;
    }

    console.log(`  [OK] Created user: ${userData.email}`);
    userIdMap.set(userData.email, data.user.id);
  }

  return userIdMap;
}


/**
 * Seeds all entities in dependency order.
 * Passes ID maps to child seeders to maintain relationships.
 */
async function seedAll(): Promise<void> {
  console.log("=".repeat(60));
  console.log("STARTING DATABASE SEED");
  console.log("=".repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  try {
    // 1. Seed test users first (needed for user_id foreign keys)
    const userIdMap = await seedTestUsers();

    // 2. Seed entities in dependency order
    // TODO: Adjust order based on your entity relationships
    // Store ID maps for entities that may be referenced by later entities
    const entityIdMaps: Record<string, Map<string, string>> = {};


    console.log("\n" + "=".repeat(60));
    console.log("SEED COMPLETE");
    console.log("=".repeat(60));
    console.log("\nTest credentials:");
    for (const user of TEST_USERS) {
      console.log(`  ${user.email} / ${user.password}`);
    }
  } catch (error) {
    console.error("\nSEED FAILED:", error);
    process.exit(1);
  }
}

// ============================================================
// RESET FUNCTIONS
// ============================================================

/**
 * Clears all data from the database.
 * WARNING: This is destructive! Only use in development.
 */
async function resetAll(): Promise<void> {
  console.log("=".repeat(60));
  console.log("RESETTING DATABASE");
  console.log("=".repeat(60));
  console.log(`Environment: ${NODE_ENV}`);

  // Double-check we're not in production
  if (isProduction && !isExplicitlyAllowed) {
    console.error("ABORT: Cannot reset production database!");
    process.exit(1);
  }

  try {
    // Delete in reverse dependency order to avoid FK violations
    // Delete test users
    console.log("  Clearing test users...");
    const { data: users } = await supabase.auth.admin.listUsers();
    for (const userData of TEST_USERS) {
      const user = users?.users.find((u) => u.email === userData.email);
      if (user) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`    Deleted user: ${userData.email}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("RESET COMPLETE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\nRESET FAILED:", error);
    process.exit(1);
  }
}

// ============================================================
// CLI RUNNER
// ============================================================

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "seed":
      await seedAll();
      break;

    case "reset":
      await resetAll();
      break;

    case "seed-dev":
      // Full refresh: reset then seed
      await resetAll();
      await seedAll();
      break;

    default:
      console.log("Usage: npx tsx scripts/seed.ts <command>");
      console.log("");
      console.log("Commands:");
      console.log("  seed      Seed the database with test data");
      console.log("  reset     Clear all data from the database");
      console.log("  seed-dev  Reset and re-seed (full refresh)");
      console.log("");
      console.log("Environment:");
      console.log("  NEXT_PUBLIC_SUPABASE_URL      Required");
      console.log("  SUPABASE_SERVICE_ROLE_KEY     Required (for bypassing RLS)");
      console.log("  NODE_ENV                      Prevents running in production");
      console.log("  ALLOW_SEED_IN_PRODUCTION      Override production check (dangerous)");
      process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
