/**
 * Redo API
 *
 * POST /api/images/[id]/edit/redo
 *
 * Redoes the last undone operation by incrementing current_position.
 * - Uses post_snapshot_url of operation at new position (always cached)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import type {
  UndoRedoResponse,
  EditErrorResponse,
  EditSession,
} from '@/types/edit-history';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UndoRedoResponse | EditErrorResponse>> {
  try {
    const { id: imageId } = await params;

    // Authenticate
    const auth = await getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = auth.method === 'api_key'
      ? createServiceRoleClient()
      : await createClient();

    const userId = auth.userId;

    // Get active session
    const { data: session, error: sessionError } = await supabase
      .from('edit_sessions')
      .select('*')
      .eq('image_id', imageId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active edit session' },
        { status: 400 }
      );
    }

    // Get all operations to check max position
    const { data: operations } = await supabase
      .from('edit_operations')
      .select('*')
      .eq('session_id', session.id)
      .order('position', { ascending: true });

    const ops = operations || [];

    // Calculate max position
    const maxPosition = ops.length > 0
      ? Math.max(...ops.map(op => op.position))
      : 0;

    // Check if we can redo
    if (session.current_position >= maxPosition) {
      return NextResponse.json(
        { error: 'Nothing to redo' },
        { status: 400 }
      );
    }

    // Calculate new position
    const newPosition = session.current_position + 1;

    // Find operation at new position
    const targetOp = ops.find(op => op.position === newPosition);
    if (!targetOp?.post_snapshot_url) {
      return NextResponse.json(
        { error: 'Cannot redo - snapshot not found' },
        { status: 500 }
      );
    }

    const newSnapshotUrl = targetOp.post_snapshot_url;

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('edit_sessions')
      .update({
        current_position: newPosition,
        current_snapshot_url: newSnapshotUrl,
        version: session.version + 1,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession as EditSession,
      currentDisplayUrl: newSnapshotUrl,
      canUndo: newPosition > 0,
      canRedo: newPosition < maxPosition,
    });
  } catch (error) {
    console.error('Redo error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Redo failed' },
      { status: 500 }
    );
  }
}
