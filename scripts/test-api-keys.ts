/**
 * E2E Test for API Keys Feature
 *
 * Tests:
 * 1. Create API key via session auth
 * 2. List API keys
 * 3. Use API key to authenticate against /api/presets
 * 4. Revoke API key
 * 5. Verify revoked key is rejected
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BASE_URL = "http://localhost:3000";

// Test user credentials - using existing test user
const TEST_EMAIL = "test-e2e@mytrimmy.test";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function log(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${details}`);
}

async function getSessionCookies(
  accessToken: string,
  refreshToken: string
): Promise<string> {
  // Supabase SSR uses these cookie names
  return [
    `sb-${SUPABASE_URL.split("//")[1].split(".")[0]}-auth-token=${encodeURIComponent(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
      })
    )}`,
  ].join("; ");
}

async function main() {
  console.log("=".repeat(60));
  console.log("  API KEYS E2E TEST");
  console.log("=".repeat(60));
  console.log();

  // Step 1: Sign in to get session
  console.log("[1/6] Authenticating test user...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

  if (authError || !authData.session) {
    log("Authentication", false, `Failed: ${authError?.message || "No session"}`);
    console.log("\n⚠️  Cannot continue without authentication.");
    console.log("    Set TEST_USER_PASSWORD env var or create test user.");
    printResults();
    process.exit(1);
  }

  log("Authentication", true, `Signed in as ${TEST_EMAIL}`);
  const cookies = await getSessionCookies(
    authData.session.access_token,
    authData.session.refresh_token
  );

  // Step 2: Create API key
  console.log("\n[2/6] Creating API key...");
  let createdKeyId: string | null = null;
  let createdKey: string | null = null;

  try {
    const createRes = await fetch(`${BASE_URL}/api/api-keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
      },
      body: JSON.stringify({ name: "E2E Test Key" }),
    });

    const createData = await createRes.json();

    if (createRes.ok && createData.success && createData.data?.key) {
      createdKeyId = createData.data.id;
      createdKey = createData.data.key;
      log(
        "Create API Key",
        true,
        `Created key ${createdKey?.slice(0, 15)}...${createdKey?.slice(-4)}`
      );
    } else {
      log("Create API Key", false, `Failed: ${JSON.stringify(createData)}`);
    }
  } catch (e) {
    log("Create API Key", false, `Error: ${e}`);
  }

  // Step 3: List API keys
  console.log("\n[3/6] Listing API keys...");
  try {
    const listRes = await fetch(`${BASE_URL}/api/api-keys`, {
      headers: { Cookie: cookies },
    });
    const listData = await listRes.json();

    if (listRes.ok && listData.success && Array.isArray(listData.data)) {
      const found = listData.data.find(
        (k: { id: string }) => k.id === createdKeyId
      );
      if (found) {
        log(
          "List API Keys",
          true,
          `Found ${listData.data.length} key(s), including our new key`
        );
      } else {
        log("List API Keys", false, "Key not found in list");
      }
    } else {
      log("List API Keys", false, `Failed: ${JSON.stringify(listData)}`);
    }
  } catch (e) {
    log("List API Keys", false, `Error: ${e}`);
  }

  // Step 4: Use API key to authenticate
  console.log("\n[4/6] Testing API key authentication on /api/presets...");
  if (createdKey) {
    try {
      const authRes = await fetch(`${BASE_URL}/api/presets`, {
        headers: {
          Authorization: `Bearer ${createdKey}`,
        },
      });
      const authData = await authRes.json();

      if (authRes.ok && authData.success) {
        log(
          "API Key Auth",
          true,
          `Authenticated successfully, got ${authData.data?.length || 0} presets`
        );
      } else if (authRes.status === 401) {
        log("API Key Auth", false, `Unauthorized: ${JSON.stringify(authData)}`);
      } else {
        log("API Key Auth", false, `Failed: ${JSON.stringify(authData)}`);
      }
    } catch (e) {
      log("API Key Auth", false, `Error: ${e}`);
    }
  } else {
    log("API Key Auth", false, "Skipped - no key to test");
  }

  // Step 5: Revoke API key
  console.log("\n[5/6] Revoking API key...");
  if (createdKeyId) {
    try {
      const revokeRes = await fetch(`${BASE_URL}/api/api-keys/${createdKeyId}`, {
        method: "DELETE",
        headers: { Cookie: cookies },
      });
      const revokeData = await revokeRes.json();

      if (revokeRes.ok && revokeData.success) {
        log("Revoke API Key", true, "Key revoked successfully");
      } else {
        log("Revoke API Key", false, `Failed: ${JSON.stringify(revokeData)}`);
      }
    } catch (e) {
      log("Revoke API Key", false, `Error: ${e}`);
    }
  } else {
    log("Revoke API Key", false, "Skipped - no key to revoke");
  }

  // Step 6: Verify revoked key is rejected
  console.log("\n[6/6] Verifying revoked key is rejected...");
  if (createdKey) {
    try {
      const rejectedRes = await fetch(`${BASE_URL}/api/presets`, {
        headers: {
          Authorization: `Bearer ${createdKey}`,
        },
      });
      const rejectedData = await rejectedRes.json();

      if (rejectedRes.status === 401) {
        log("Revoked Key Rejected", true, "Revoked key correctly rejected");
      } else {
        log(
          "Revoked Key Rejected",
          false,
          `Expected 401, got ${rejectedRes.status}: ${JSON.stringify(rejectedData)}`
        );
      }
    } catch (e) {
      log("Revoked Key Rejected", false, `Error: ${e}`);
    }
  } else {
    log("Revoked Key Rejected", false, "Skipped - no key to test");
  }

  printResults();
}

function printResults() {
  console.log("\n" + "=".repeat(60));
  console.log("  RESULTS");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n  Passed: ${passed}/${total}`);

  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log("\n  FAILURES:");
    failed.forEach((f) => console.log(`    - ${f.name}: ${f.details}`));
  }

  console.log("\n" + "=".repeat(60));
  if (passed === total) {
    console.log("  ✅ ALL TESTS PASSED");
  } else {
    console.log("  ❌ SOME TESTS FAILED");
  }
  console.log("=".repeat(60));

  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
