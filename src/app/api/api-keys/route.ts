/**
 * API Keys Management
 *
 * GET /api/api-keys - List all API keys for the current user
 * POST /api/api-keys - Create a new API key
 *
 * NOTE: These endpoints only accept session auth (not API key auth).
 * API keys should be managed through the dashboard, not programmatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey, formatKeyForDisplay } from "@/lib/api-keys";

export interface ApiKeyInput {
  name: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key_display: string;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
}

/**
 * GET /api/api-keys
 * List all API keys for the current user (never returns full key)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, key_suffix, permissions, created_at, last_used_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format keys for display (never expose full key)
    const formattedKeys: ApiKeyResponse[] = (keys || []).map((key) => ({
      id: key.id,
      name: key.name,
      key_display: formatKeyForDisplay(key.key_prefix, key.key_suffix),
      permissions: key.permissions as string[],
      created_at: key.created_at,
      last_used_at: key.last_used_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedKeys,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/api-keys
 * Create a new API key. Returns the full key ONCE - must be copied immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ApiKeyInput = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { error: "Name must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Generate the API key
    const { key, hash, prefix, suffix } = generateApiKey();

    // Store in database
    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        key_prefix: prefix,
        key_suffix: suffix,
        key_hash: hash,
        permissions: ["*"], // Default: all permissions
      })
      .select("id, name, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the full key - this is the ONLY time it will be shown
    return NextResponse.json(
      {
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: key, // FULL KEY - show once, user must copy
          created_at: apiKey.created_at,
        },
        message: "API key created. Copy it now - it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create API key" },
      { status: 500 }
    );
  }
}
