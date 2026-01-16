/**
 * Discard Session API
 *
 * POST /api/images/[id]/edit/discard
 *
 * Abandons the edit session:
 * - Marks session as 'abandoned'
 * - Clears active_edit_session_id from image
 * - Does NOT delete temporary snapshots (cleanup job handles those)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import type {
  DiscardSessionResponse,
  EditErrorResponse,
} from '@/types/edit-history';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DiscardSessionResponse | EditErrorResponse>> {
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
      .select('id, version')
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

    // Clear active session reference from image
    const { error: imageUpdateError } = await supabase
      .from('images')
      .update({ active_edit_session_id: null })
      .eq('id', imageId);

    if (imageUpdateError) {
      console.error('Failed to clear image session reference:', imageUpdateError);
      // Continue anyway - session status update is more important
    }

    // Mark session as abandoned
    const { error: sessionUpdateError } = await supabase
      .from('edit_sessions')
      .update({
        status: 'abandoned',
        version: session.version + 1,
      })
      .eq('id', session.id);

    if (sessionUpdateError) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Note: Temporary snapshots in storage are NOT deleted here.
    // A scheduled cleanup job should handle abandoned session cleanup.
    // This keeps the discard operation fast and prevents data loss
    // if the user changes their mind quickly.

    return NextResponse.json({
      success: true,
      message: 'Edit session discarded',
    });
  } catch (error) {
    console.error('Discard session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discard failed' },
      { status: 500 }
    );
  }
}
