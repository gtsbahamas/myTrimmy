/**
 * Individual Preset API
 *
 * GET /api/presets/[id] - Get a specific preset
 * PATCH /api/presets/[id] - Update a preset
 * DELETE /api/presets/[id] - Delete a preset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import type { ProcessSettings, PresetInput } from '../route';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preset, error } = await supabase
      .from('presets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: preset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch preset' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('presets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    const body: Partial<PresetInput> = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.settings !== undefined) {
      if (typeof body.settings !== 'object') {
        return NextResponse.json({ error: 'Invalid settings object' }, { status: 400 });
      }
      // Validate threshold if present
      const threshold = body.settings.trim?.threshold;
      if (threshold !== undefined && (threshold < 0 || threshold > 255)) {
        return NextResponse.json({ error: 'Trim threshold must be 0-255' }, { status: 400 });
      }
      // Validate quality if present
      const quality = body.settings.optimize?.quality;
      if (quality !== undefined && (quality < 1 || quality > 100)) {
        return NextResponse.json({ error: 'Quality must be 1-100' }, { status: 400 });
      }
      updates.settings = body.settings as unknown as Json;
    }

    if (body.is_default !== undefined) {
      // If setting as default, unset other defaults first
      if (body.is_default) {
        await supabase
          .from('presets')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }
      updates.is_default = body.is_default;
    }

    updates.updated_at = new Date().toISOString();

    const { data: preset, error } = await supabase
      .from('presets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: preset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update preset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preset deleted',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete preset' },
      { status: 500 }
    );
  }
}
