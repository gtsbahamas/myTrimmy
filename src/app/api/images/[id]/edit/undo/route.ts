/**
 * Undo API
 *
 * POST /api/images/[id]/edit/undo
 *
 * Undoes the last operation by decrementing current_position.
 * - Position 0 = original image
 * - Uses pre_snapshot_url if available (fast undo for expensive ops)
 * - Otherwise uses post_snapshot_url of previous position
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

    // Check if we can undo
    if (session.current_position <= 0) {
      return NextResponse.json(
        { error: 'Nothing to undo' },
        { status: 400 }
      );
    }

    // Get image for original URL
    const { data: image } = await supabase
      .from('images')
      .select('original_url')
      .eq('id', imageId)
      .single();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get all operations
    const { data: operations } = await supabase
      .from('edit_operations')
      .select('*')
      .eq('session_id', session.id)
      .order('position', { ascending: true });

    const ops = operations || [];

    // Determine new position and display URL
    const newPosition = session.current_position - 1;
    let newSnapshotUrl: string | null;

    if (newPosition === 0) {
      // Going back to original
      newSnapshotUrl = null;
    } else {
      // Find operation at current position (the one we're undoing)
      const currentOp = ops.find(op => op.position === session.current_position);

      // If current operation has pre_snapshot_url, use it (fast undo)
      if (currentOp?.pre_snapshot_url) {
        newSnapshotUrl = currentOp.pre_snapshot_url;
      } else {
        // Use post_snapshot_url of the previous operation
        const prevOp = ops.find(op => op.position === newPosition);
        newSnapshotUrl = prevOp?.post_snapshot_url || null;
      }
    }

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

    // Calculate max position for canRedo
    const maxPosition = ops.length > 0
      ? Math.max(...ops.map(op => op.position))
      : 0;

    // Determine display URL
    const currentDisplayUrl = newPosition === 0
      ? image.original_url
      : newSnapshotUrl || image.original_url;

    return NextResponse.json({
      success: true,
      session: updatedSession as EditSession,
      currentDisplayUrl,
      canUndo: newPosition > 0,
      canRedo: newPosition < maxPosition,
    });
  } catch (error) {
    console.error('Undo error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Undo failed' },
      { status: 500 }
    );
  }
}
