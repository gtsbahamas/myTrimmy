/**
 * Single API Key Operations
 *
 * GET /api/api-keys/[id] - Get details of a specific API key
 * DELETE /api/api-keys/[id] - Revoke an API key (soft delete)
 *
 * NOTE: These endpoints only accept session auth (not API key auth).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKeyForDisplay } from "@/lib/api-keys";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/api-keys/[id]
 * Get details of a specific API key (never returns full key)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: key, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, key_suffix, permissions, created_at, last_used_at, revoked_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !key) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: key.id,
        name: key.name,
        key_display: formatKeyForDisplay(key.key_prefix, key.key_suffix),
        permissions: key.permissions as string[],
        created_at: key.created_at,
        last_used_at: key.last_used_at,
        revoked: key.revoked_at !== null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch API key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/api-keys/[id]
 * Revoke an API key (soft delete - sets revoked_at timestamp)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership first
    const { data: existingKey, error: fetchError } = await supabase
      .from("api_keys")
      .select("id, revoked_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    if (existingKey.revoked_at !== null) {
      return NextResponse.json(
        { error: "API key is already revoked" },
        { status: 400 }
      );
    }

    // Soft delete by setting revoked_at
    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke API key" },
      { status: 500 }
    );
  }
}
