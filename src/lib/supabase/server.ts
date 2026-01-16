import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import {
  hashApiKey,
  isValidKeyFormat,
  compareHashes,
  extractApiKeyFromHeader,
} from "@/lib/api-keys";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  );
}

/**
 * Get the current authenticated user.
 * Returns the user object or null if not authenticated.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Create a Supabase client with service role privileges.
 * Use sparingly - bypasses RLS.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Validate an API key and return the associated user ID.
 * Uses service role to bypass RLS for key lookup.
 *
 * @param apiKey The raw API key from the Authorization header
 * @returns User ID if valid, null if invalid or revoked
 */
export async function getUserFromApiKey(
  apiKey: string
): Promise<{ userId: string; keyId: string } | null> {
  // Validate format first (fast path for invalid keys)
  if (!isValidKeyFormat(apiKey)) {
    return null;
  }

  // Hash the key for lookup
  const keyHash = hashApiKey(apiKey);

  try {
    // Use service role to bypass RLS
    const supabase = createServiceRoleClient();

    // Look up the key by hash
    const { data: keyRecord, error } = await supabase
      .from("api_keys")
      .select("id, user_id, key_hash, revoked_at")
      .eq("key_hash", keyHash)
      .is("revoked_at", null)
      .single();

    if (error || !keyRecord) {
      return null;
    }

    // Constant-time comparison to prevent timing attacks
    if (!compareHashes(keyHash, keyRecord.key_hash)) {
      return null;
    }

    // Update last_used_at asynchronously (don't block the request)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyRecord.id)
      .then(() => {
        // Fire and forget - don't care about result
      });

    return {
      userId: keyRecord.user_id,
      keyId: keyRecord.id,
    };
  } catch {
    return null;
  }
}

/**
 * Authentication result from getAuthFromRequest
 */
export type AuthResult =
  | { authenticated: true; userId: string; method: "session" | "api_key"; keyId?: string }
  | { authenticated: false; error: string };

/**
 * Get authenticated user from a request.
 * Checks both session auth (cookies) and API key auth (Authorization header).
 *
 * Priority: API key > Session (API key is more explicit)
 *
 * @param request The incoming request (NextRequest or Request with headers)
 * @returns AuthResult with user ID and auth method, or error
 */
export async function getAuthFromRequest(
  request: { headers: { get: (name: string) => string | null } }
): Promise<AuthResult> {
  // Check for API key first (explicit auth takes priority)
  const authHeader = request.headers.get("authorization");
  const apiKey = extractApiKeyFromHeader(authHeader);

  if (apiKey) {
    const result = await getUserFromApiKey(apiKey);
    if (result) {
      return {
        authenticated: true,
        userId: result.userId,
        method: "api_key",
        keyId: result.keyId,
      };
    }
    // API key was provided but invalid
    return { authenticated: false, error: "Invalid API key" };
  }

  // Fall back to session auth
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false, error: "Not authenticated" };
    }

    return {
      authenticated: true,
      userId: user.id,
      method: "session",
    };
  } catch {
    return { authenticated: false, error: "Authentication failed" };
  }
}
