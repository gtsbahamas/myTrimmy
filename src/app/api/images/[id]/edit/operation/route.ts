/**
 * Apply Operation API
 *
 * POST /api/images/[id]/edit/operation
 *
 * Applies a new operation to the edit session.
 * - Truncates operations after current position (no branching)
 * - For expensive ops, saves pre-snapshot
 * - Executes operation and saves post-snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import sharp from 'sharp';
import type {
  ApplyOperationRequest,
  ApplyOperationResponse,
  EditErrorResponse,
  EditSession,
  EditOperationRecord,
  EditOperation,
} from '@/types/edit-history';
import { isExpensiveOperation } from '@/types/edit-history';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to parse aspect ratio
function parseAspectRatio(ratio: string): { w: number; h: number } | null {
  const match = ratio.match(/^(\d+):(\d+)$/);
  if (!match) return null;
  return { w: parseInt(match[1], 10), h: parseInt(match[2], 10) };
}

// Calculate center crop for aspect ratio
function calculateAspectCrop(
  width: number,
  height: number,
  aspectW: number,
  aspectH: number
): { left: number; top: number; width: number; height: number } {
  const imageRatio = width / height;
  const targetRatio = aspectW / aspectH;

  let cropWidth: number;
  let cropHeight: number;

  if (imageRatio > targetRatio) {
    cropHeight = height;
    cropWidth = Math.round(cropHeight * targetRatio);
  } else {
    cropWidth = width;
    cropHeight = Math.round(cropWidth / targetRatio);
  }

  return {
    left: Math.round((width - cropWidth) / 2),
    top: Math.round((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

// Execute a single operation on an image buffer
async function executeOperation(
  imageBuffer: Buffer,
  operation: EditOperation,
  _supabase: ReturnType<typeof createServiceRoleClient>,
  _userId: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const pipeline = sharp(imageBuffer);
  let contentType = 'image/png';

  switch (operation.type) {
    case 'trim': {
      const { threshold = 10, lineArt = false } = operation.params;
      const result = await pipeline.trim({ threshold, lineArt }).toBuffer();
      return { buffer: Buffer.from(result), contentType };
    }

    case 'crop': {
      const metadata = await sharp(imageBuffer).metadata();
      const { mode, aspectRatio, left = 0, top = 0, width, height } = operation.params;

      let cropParams: { left: number; top: number; width: number; height: number };

      if (mode === 'aspect' && aspectRatio) {
        const ratio = parseAspectRatio(aspectRatio);
        if (ratio && metadata.width && metadata.height) {
          cropParams = calculateAspectCrop(metadata.width, metadata.height, ratio.w, ratio.h);
        } else {
          throw new Error('Invalid aspect ratio');
        }
      } else if (width && height) {
        cropParams = {
          left: Math.max(0, left),
          top: Math.max(0, top),
          width: Math.min(width, (metadata.width || 0) - left),
          height: Math.min(height, (metadata.height || 0) - top),
        };
      } else {
        throw new Error('Crop requires width/height or aspectRatio');
      }

      const result = await pipeline.extract(cropParams).toBuffer();
      return { buffer: Buffer.from(result), contentType };
    }

    case 'rotate': {
      const { angle = 0, flipH = false, flipV = false } = operation.params;
      let result = imageBuffer;

      if (angle !== 0) {
        result = await sharp(result).rotate(angle).toBuffer();
      }
      if (flipH) {
        result = await sharp(result).flop().toBuffer();
      }
      if (flipV) {
        result = await sharp(result).flip().toBuffer();
      }

      return { buffer: Buffer.from(result), contentType };
    }

    case 'resize': {
      const { width, height, fit = 'inside', withoutEnlargement = true } = operation.params;
      const result = await pipeline
        .resize({ width, height, fit, withoutEnlargement })
        .toBuffer();
      return { buffer: Buffer.from(result), contentType };
    }

    case 'optimize': {
      const { quality = 80 } = operation.params;
      const metadata = await sharp(imageBuffer).metadata();

      let result: Buffer;
      switch (metadata.format) {
        case 'jpeg':
          result = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
          contentType = 'image/jpeg';
          break;
        case 'webp':
          result = await pipeline.webp({ quality }).toBuffer();
          contentType = 'image/webp';
          break;
        default:
          result = await pipeline.png({ compressionLevel: 9 }).toBuffer();
          contentType = 'image/png';
      }
      return { buffer: Buffer.from(result), contentType };
    }

    case 'convert': {
      const { format } = operation.params;
      let result: Buffer;

      switch (format) {
        case 'jpeg':
          result = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
          contentType = 'image/jpeg';
          break;
        case 'webp':
          result = await pipeline.webp({ quality: 80 }).toBuffer();
          contentType = 'image/webp';
          break;
        default:
          result = await pipeline.png({ compressionLevel: 9 }).toBuffer();
          contentType = 'image/png';
      }
      return { buffer: Buffer.from(result), contentType };
    }

    case 'removeBackground': {
      // This is handled specially - requires Replicate API
      // For now, delegate to the existing remove-background endpoint
      throw new Error('Background removal should use dedicated endpoint');
    }

    default:
      throw new Error(`Unknown operation type: ${(operation as EditOperation).type}`);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApplyOperationResponse | EditErrorResponse>> {
  const startTime = Date.now();

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
    const body: ApplyOperationRequest = await request.json();
    if (!body.operation) {
      return NextResponse.json({ error: 'Operation required' }, { status: 400 });
    }

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
        { error: 'No active edit session. Call /edit/start first.' },
        { status: 400 }
      );
    }

    // Get image record
    const { data: image } = await supabase
      .from('images')
      .select('original_url, processed_url')
      .eq('id', imageId)
      .single();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Truncate operations after current position (no branching)
    if (session.current_position > 0) {
      await supabase
        .from('edit_operations')
        .delete()
        .eq('session_id', session.id)
        .gt('position', session.current_position);
    }

    // Get current state (either from snapshot or by replaying)
    let currentBuffer: Buffer;

    if (session.current_position === 0) {
      // Download original image
      const storagePath = image.original_url.includes('/storage/v1/object/public/')
        ? image.original_url.split('/storage/v1/object/public/images/')[1]
        : `${userId}/${image.original_url.split('/').pop()}`;

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('images')
        .download(storagePath);

      if (downloadError || !fileData) {
        return NextResponse.json(
          { error: 'Failed to download original image' },
          { status: 500 }
        );
      }

      currentBuffer = Buffer.from(await fileData.arrayBuffer());
    } else if (session.current_snapshot_url) {
      // Download current snapshot
      const snapshotPath = session.current_snapshot_url.split('/storage/v1/object/public/processed/')[1];

      const { data: snapshotData, error: snapshotError } = await supabase.storage
        .from('processed')
        .download(snapshotPath);

      if (snapshotError || !snapshotData) {
        return NextResponse.json(
          { error: 'Failed to download current snapshot' },
          { status: 500 }
        );
      }

      currentBuffer = Buffer.from(await snapshotData.arrayBuffer());
    } else {
      return NextResponse.json(
        { error: 'Session state is invalid' },
        { status: 500 }
      );
    }

    // For expensive operations, save pre-snapshot
    let preSnapshotUrl: string | null = null;
    if (isExpensiveOperation(body.operation) && session.current_position > 0) {
      const prePath = `${userId}/edit-${session.id}-pre-${session.current_position + 1}.png`;
      const { error: preUploadError } = await supabase.storage
        .from('processed')
        .upload(prePath, currentBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (!preUploadError) {
        const { data: preUrl } = supabase.storage
          .from('processed')
          .getPublicUrl(prePath);
        preSnapshotUrl = preUrl.publicUrl;
      }
    }

    // Execute the operation
    const { buffer: resultBuffer, contentType } = await executeOperation(
      currentBuffer,
      body.operation,
      supabase,
      userId
    );

    // Upload result as post-snapshot
    const newPosition = session.current_position + 1;
    const ext = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/webp' ? 'webp' : 'png';
    const postPath = `${userId}/edit-${session.id}-pos-${newPosition}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('processed')
      .upload(postPath, resultBuffer, { contentType, cacheControl: '3600' });

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload result: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: postUrl } = supabase.storage
      .from('processed')
      .getPublicUrl(postPath);

    const duration = Date.now() - startTime;

    // Create operation record
    const { data: opRecord, error: opError } = await supabase
      .from('edit_operations')
      .insert({
        session_id: session.id,
        position: newPosition,
        operation_type: body.operation.type,
        params: body.operation.params,
        pre_snapshot_url: preSnapshotUrl,
        post_snapshot_url: postUrl.publicUrl,
        duration_ms: duration,
      })
      .select()
      .single();

    if (opError || !opRecord) {
      return NextResponse.json(
        { error: 'Failed to save operation record' },
        { status: 500 }
      );
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('edit_sessions')
      .update({
        current_position: newPosition,
        current_snapshot_url: postUrl.publicUrl,
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

    // Get all operations for canRedo calculation
    const { data: allOps } = await supabase
      .from('edit_operations')
      .select('position')
      .eq('session_id', session.id);

    const maxPosition = allOps && allOps.length > 0
      ? Math.max(...allOps.map(op => op.position))
      : newPosition;

    return NextResponse.json({
      success: true,
      session: updatedSession as EditSession,
      operation: opRecord as EditOperationRecord,
      currentDisplayUrl: postUrl.publicUrl,
      canUndo: newPosition > 0,
      canRedo: newPosition < maxPosition,
    });
  } catch (error) {
    console.error('Apply operation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
}
