/**
 * Start Edit Session API
 *
 * POST /api/images/[id]/edit/start
 *
 * Starts or resumes an edit session for an image.
 * - If active session exists, returns it
 * - If forceNew=true, abandons existing session and creates new
 * - Otherwise creates new session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import type {
  StartEditSessionRequest,
  StartEditSessionResponse,
  EditErrorResponse,
  EditSession,
  EditOperationRecord,
} from '@/types/edit-history';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<StartEditSessionResponse | EditErrorResponse>> {
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

    // Parse request body
    let body: StartEditSessionRequest = {};
    try {
      body = await request.json();
    } catch {
      // No body - use defaults
    }

    // Verify image belongs to user
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, original_url, processed_url')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check for existing active session
    const { data: existingSession } = await supabase
      .from('edit_sessions')
      .select('*')
      .eq('image_id', imageId)
      .eq('status', 'active')
      .single();

    let session: EditSession;
    let operations: EditOperationRecord[] = [];

    if (existingSession && !body.forceNew) {
      // Resume existing session
      session = existingSession as EditSession;

      // Get operations
      const { data: ops } = await supabase
        .from('edit_operations')
        .select('*')
        .eq('session_id', session.id)
        .order('position', { ascending: true });

      operations = (ops || []) as EditOperationRecord[];
    } else {
      // Abandon existing session if forceNew
      if (existingSession && body.forceNew) {
        await supabase
          .from('edit_sessions')
          .update({ status: 'abandoned' })
          .eq('id', existingSession.id);
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('edit_sessions')
        .insert({
          image_id: imageId,
          user_id: userId,
          current_position: 0,
          current_snapshot_url: null,
          status: 'active',
        })
        .select()
        .single();

      if (createError || !newSession) {
        console.error('Failed to create session:', createError);
        return NextResponse.json(
          { error: 'Failed to create edit session' },
          { status: 500 }
        );
      }

      session = newSession as EditSession;

      // Update image with active session reference
      await supabase
        .from('images')
        .update({ active_edit_session_id: session.id })
        .eq('id', imageId);
    }

    // Determine current display URL
    // Position 0 = original, otherwise use current_snapshot_url or replay
    let currentDisplayUrl: string;
    if (session.current_position === 0) {
      currentDisplayUrl = image.original_url;
    } else if (session.current_snapshot_url) {
      currentDisplayUrl = session.current_snapshot_url;
    } else if (operations.length > 0) {
      // Find operation at current position
      const currentOp = operations.find(op => op.position === session.current_position);
      currentDisplayUrl = currentOp?.post_snapshot_url || image.original_url;
    } else {
      currentDisplayUrl = image.original_url;
    }

    // Calculate canUndo/canRedo
    const maxPosition = operations.length > 0
      ? Math.max(...operations.map(op => op.position))
      : 0;

    return NextResponse.json({
      success: true,
      session,
      operations,
      currentDisplayUrl,
      canUndo: session.current_position > 0,
      canRedo: session.current_position < maxPosition,
    });
  } catch (error) {
    console.error('Start session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start session' },
      { status: 500 }
    );
  }
}
