/**
 * Presets API
 *
 * GET /api/presets - List all presets for the current user
 * POST /api/presets - Create a new preset
 *
 * Supports both session auth and API key auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

export interface ProcessSettings {
  trim?: {
    enabled?: boolean;
    threshold?: number;
    lineArt?: boolean;
  };
  resize?: {
    enabled?: boolean;
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    withoutEnlargement?: boolean;
  };
  optimize?: {
    enabled?: boolean;
    quality?: number;
  };
  convert?: {
    enabled?: boolean;
    format?: 'jpeg' | 'png' | 'webp';
  };
}

export interface PresetInput {
  name: string;
  description?: string;
  settings: ProcessSettings;
  is_default?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Support both session and API key auth
    const auth = await getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Use service role client for API key auth (no session for RLS)
    // Use regular client for session auth (RLS will work)
    const supabase = auth.method === 'api_key'
      ? createServiceRoleClient()
      : await createClient();

    const { data: presets, error } = await supabase
      .from('presets')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Support both session and API key auth
    const auth = await getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = auth.method === 'api_key'
      ? createServiceRoleClient()
      : await createClient();

    const body: PresetInput = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json({ error: 'Valid settings object required' }, { status: 400 });
    }

    // Validate threshold if trim is enabled
    const threshold = body.settings.trim?.threshold;
    if (threshold !== undefined && (threshold < 0 || threshold > 255)) {
      return NextResponse.json({ error: 'Trim threshold must be between 0 and 255' }, { status: 400 });
    }

    // Validate quality if optimize is enabled
    const quality = body.settings.optimize?.quality;
    if (quality !== undefined && (quality < 1 || quality > 100)) {
      return NextResponse.json({ error: 'Quality must be between 1 and 100' }, { status: 400 });
    }

    // If setting as default, unset other defaults first
    if (body.is_default) {
      await supabase
        .from('presets')
        .update({ is_default: false })
        .eq('user_id', auth.userId);
    }

    const { data: preset, error } = await supabase
      .from('presets')
      .insert({
        user_id: auth.userId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        settings: body.settings as unknown as Json,
        is_default: body.is_default || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: preset,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create preset' },
      { status: 500 }
    );
  }
}
