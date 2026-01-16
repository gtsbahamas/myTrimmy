/**
 * Save Session API
 *
 * POST /api/images/[id]/edit/save
 *
 * Finalizes the edit session:
 * - Updates image.processed_url with current snapshot
 * - Marks session as 'saved'
 * - Clears active_edit_session_id from image
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import sharp from 'sharp';
import type {
  SaveSessionResponse,
  EditErrorResponse,
  EditSession,
} from '@/types/edit-history';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SaveSessionResponse | EditErrorResponse>> {
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

    // Get image
    const { data: image } = await supabase
      .from('images')
      .select('original_url, filename')
      .eq('id', imageId)
      .single();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    let processedUrl: string;
    let width: number | undefined;
    let height: number | undefined;

    if (session.current_position === 0) {
      // No edits - use original URL
      processedUrl = image.original_url;
    } else if (session.current_snapshot_url) {
      // Use current snapshot as final result
      // Download and re-upload to permanent location
      const snapshotPath = session.current_snapshot_url.split('/storage/v1/object/public/processed/')[1];

      const { data: snapshotData, error: downloadError } = await supabase.storage
        .from('processed')
        .download(snapshotPath);

      if (downloadError || !snapshotData) {
        return NextResponse.json(
          { error: 'Failed to download current snapshot' },
          { status: 500 }
        );
      }

      const buffer = Buffer.from(await snapshotData.arrayBuffer());

      // Get dimensions
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;

      // Generate permanent filename
      const baseName = image.filename.replace(/\.[^/.]+$/, '');
      const ext = snapshotPath.split('.').pop() || 'png';
      const finalFilename = `${baseName}-edited.${ext}`;
      const finalPath = `${userId}/${Date.now()}-${finalFilename}`;

      // Upload to permanent location
      const contentType = ext === 'jpg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';

      const { error: uploadError } = await supabase.storage
        .from('processed')
        .upload(finalPath, buffer, { contentType, cacheControl: '3600' });

      if (uploadError) {
        return NextResponse.json(
          { error: `Failed to save processed image: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from('processed')
        .getPublicUrl(finalPath);

      processedUrl = urlData.publicUrl;
    } else {
      return NextResponse.json(
        { error: 'Session state is invalid' },
        { status: 500 }
      );
    }

    // Update image record
    const imageUpdate: {
      processed_url: string;
      status: string;
      active_edit_session_id: null;
      width?: number;
      height?: number;
    } = {
      processed_url: processedUrl,
      status: 'completed',
      active_edit_session_id: null,
    };

    if (width) imageUpdate.width = width;
    if (height) imageUpdate.height = height;

    const { error: imageUpdateError } = await supabase
      .from('images')
      .update(imageUpdate)
      .eq('id', imageId);

    if (imageUpdateError) {
      return NextResponse.json(
        { error: 'Failed to update image record' },
        { status: 500 }
      );
    }

    // Mark session as saved
    const { data: updatedSession, error: sessionUpdateError } = await supabase
      .from('edit_sessions')
      .update({
        status: 'saved',
        saved_at: new Date().toISOString(),
        version: session.version + 1,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (sessionUpdateError || !updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Optionally clean up temporary snapshots (could be done async)
    // For now, leave them for potential future reference

    return NextResponse.json({
      success: true,
      session: updatedSession as EditSession,
      processed_url: processedUrl,
      message: 'Edit session saved successfully',
    });
  } catch (error) {
    console.error('Save session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}
