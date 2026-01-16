/**
 * Image Processing API - Full Pipeline
 *
 * POST /api/images/[id]/process
 *
 * Processes an image with configurable pipeline:
 * 1. Trim - Auto-trim whitespace/borders
 * 2. Crop - Extract region (manual or aspect ratio)
 * 3. Rotate/Flip - Rotate or flip orientation
 * 4. Resize - Scale to target dimensions
 * 5. Optimize - Compress for smaller file size
 * 6. Convert - Change output format
 *
 * Note: Background removal is handled client-side for performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import sharp from 'sharp';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ProcessSettings {
  // Trim settings
  trim?: {
    enabled?: boolean;
    threshold?: number;  // 0-255, default 10
    lineArt?: boolean;   // default false
  };
  // Crop settings (applied after trim)
  crop?: {
    enabled?: boolean;
    mode?: 'manual' | 'aspect';  // manual = exact pixels, aspect = ratio-based center crop
    // Manual mode options
    left?: number;       // X offset from left edge
    top?: number;        // Y offset from top edge
    width?: number;      // Crop width in pixels
    height?: number;     // Crop height in pixels
    // Aspect mode options
    aspectRatio?: string;  // e.g., "16:9", "1:1", "4:3"
  };
  // Rotate/Flip settings (applied after crop)
  rotate?: {
    enabled?: boolean;
    angle?: 0 | 90 | 180 | 270;  // Rotation angle in degrees (clockwise)
    flipHorizontal?: boolean;    // Flip left-right (mirror)
    flipVertical?: boolean;      // Flip top-bottom
  };
  // Resize settings
  resize?: {
    enabled?: boolean;
    width?: number;      // Target width in pixels
    height?: number;     // Target height in pixels
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';  // default 'inside'
    withoutEnlargement?: boolean;  // Don't enlarge if smaller, default true
  };
  // Optimize settings
  optimize?: {
    enabled?: boolean;
    quality?: number;    // 1-100, default 80
  };
  // Convert settings
  convert?: {
    enabled?: boolean;
    format?: 'jpeg' | 'png' | 'webp';  // Output format
  };
}

interface ProcessRequest {
  settings?: ProcessSettings;
  presetId?: string;
}

// Legacy support for old TrimSettings format
interface LegacyTrimSettings {
  threshold?: number;
  lineArt?: boolean;
}

function isLegacySettings(settings: unknown): settings is LegacyTrimSettings {
  if (!settings || typeof settings !== 'object') return false;
  const s = settings as Record<string, unknown>;
  return ('threshold' in s || 'lineArt' in s) && !('trim' in s);
}

function convertLegacySettings(legacy: LegacyTrimSettings): ProcessSettings {
  return {
    trim: {
      enabled: true,
      threshold: legacy.threshold ?? 10,
      lineArt: legacy.lineArt ?? false,
    },
  };
}

const DEFAULT_SETTINGS: ProcessSettings = {
  trim: { enabled: true, threshold: 10, lineArt: false },
  crop: { enabled: false, mode: 'manual' },
  rotate: { enabled: false, angle: 0, flipHorizontal: false, flipVertical: false },
  resize: { enabled: false, fit: 'inside', withoutEnlargement: true },
  optimize: { enabled: false, quality: 80 },
  convert: { enabled: false },
};

// Helper to parse aspect ratio string to numbers
function parseAspectRatio(ratio: string): { w: number; h: number } | null {
  const match = ratio.match(/^(\d+):(\d+)$/);
  if (!match) return null;
  return { w: parseInt(match[1], 10), h: parseInt(match[2], 10) };
}

// Calculate center crop dimensions for aspect ratio
function calculateAspectCrop(
  imageWidth: number,
  imageHeight: number,
  aspectW: number,
  aspectH: number
): { left: number; top: number; width: number; height: number } {
  const imageRatio = imageWidth / imageHeight;
  const targetRatio = aspectW / aspectH;

  let cropWidth: number;
  let cropHeight: number;

  if (imageRatio > targetRatio) {
    // Image is wider - crop sides
    cropHeight = imageHeight;
    cropWidth = Math.round(cropHeight * targetRatio);
  } else {
    // Image is taller - crop top/bottom
    cropWidth = imageWidth;
    cropHeight = Math.round(cropWidth / targetRatio);
  }

  return {
    left: Math.round((imageWidth - cropWidth) / 2),
    top: Math.round((imageHeight - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Authenticate via session or API key
    const auth = await getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Use service role client for API key auth (bypasses RLS), otherwise regular client
    const supabase = auth.method === 'api_key'
      ? createServiceRoleClient()
      : await createClient();

    const userId = auth.userId;

    // Parse request body for settings
    let settings: ProcessSettings = { ...DEFAULT_SETTINGS };
    try {
      const body: ProcessRequest = await request.json();

      // If presetId provided, fetch preset settings
      if (body.presetId) {
        const { data: preset } = await supabase
          .from('presets')
          .select('settings')
          .eq('id', body.presetId)
          .single();

        if (preset?.settings) {
          // Check for legacy format
          if (isLegacySettings(preset.settings)) {
            settings = convertLegacySettings(preset.settings as LegacyTrimSettings);
          } else {
            settings = { ...DEFAULT_SETTINGS, ...preset.settings as ProcessSettings };
          }
        }
      }

      // Merge inline settings (override preset settings)
      if (body.settings && !isLegacySettings(body.settings)) {
        const inline = body.settings;
        // Only merge enabled features
        if (inline.crop?.enabled) {
          settings.crop = { ...settings.crop, ...inline.crop };
        }
        if (inline.rotate?.enabled) {
          settings.rotate = { ...settings.rotate, ...inline.rotate };
        }
        if (inline.resize?.enabled) {
          settings.resize = { ...settings.resize, ...inline.resize };
        }
        if (inline.optimize?.enabled) {
          settings.optimize = { ...settings.optimize, ...inline.optimize };
        }
        if (inline.convert?.enabled) {
          settings.convert = { ...settings.convert, ...inline.convert };
        }
        if (inline.trim) {
          settings.trim = { ...settings.trim, ...inline.trim };
        }
      } else if (body.settings && isLegacySettings(body.settings)) {
        // Legacy settings without preset - convert them
        settings = convertLegacySettings(body.settings as unknown as LegacyTrimSettings);
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Get the image record
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase.from('images').update({ status: 'processing' }).eq('id', id);

    // Download the original image from storage
    const storagePath = image.original_url.includes('/storage/v1/object/public/')
      ? image.original_url.split('/storage/v1/object/public/images/')[1]
      : `${userId}/${image.original_url.split('/').pop()}`;

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('images')
      .download(storagePath);

    if (downloadError || !fileData) {
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json(
        { error: `Failed to download image: ${downloadError?.message}` },
        { status: 500 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    let processedBuffer: Buffer = Buffer.from(arrayBuffer);

    // Get original metadata
    const originalMetadata = await sharp(processedBuffer).metadata();
    console.log(`Original: ${originalMetadata.width}x${originalMetadata.height}, format: ${originalMetadata.format}`);

    // Build processing pipeline
    let pipeline = sharp(processedBuffer);
    const operations: string[] = [];

    // 1. TRIM
    if (settings.trim?.enabled !== false) {
      try {
        const trimThreshold = Math.max(0, Math.min(255, settings.trim?.threshold ?? 10));
        const trimResult = await pipeline
          .trim({
            threshold: trimThreshold,
            lineArt: settings.trim?.lineArt ?? false,
          })
          .toBuffer();
        processedBuffer = Buffer.from(trimResult);
        pipeline = sharp(processedBuffer);
        operations.push(`trim(threshold=${trimThreshold})`);
      } catch (trimError) {
        console.warn('Trim failed, continuing with original:', trimError);
      }
    }

    // 2. CROP
    if (settings.crop?.enabled) {
      try {
        const currentMeta = await sharp(processedBuffer).metadata();
        const imgWidth = currentMeta.width || 0;
        const imgHeight = currentMeta.height || 0;

        let cropParams: { left: number; top: number; width: number; height: number } | null = null;

        if (settings.crop.mode === 'aspect' && settings.crop.aspectRatio) {
          // Aspect ratio mode - center crop to ratio
          const ratio = parseAspectRatio(settings.crop.aspectRatio);
          if (ratio && imgWidth && imgHeight) {
            cropParams = calculateAspectCrop(imgWidth, imgHeight, ratio.w, ratio.h);
          }
        } else if (settings.crop.width && settings.crop.height) {
          // Manual mode - use provided dimensions
          cropParams = {
            left: Math.max(0, settings.crop.left ?? 0),
            top: Math.max(0, settings.crop.top ?? 0),
            width: Math.min(settings.crop.width, imgWidth - (settings.crop.left ?? 0)),
            height: Math.min(settings.crop.height, imgHeight - (settings.crop.top ?? 0)),
          };
        }

        if (cropParams && cropParams.width > 0 && cropParams.height > 0) {
          const cropResult = await pipeline
            .extract(cropParams)
            .toBuffer();
          processedBuffer = Buffer.from(cropResult);
          pipeline = sharp(processedBuffer);

          if (settings.crop.mode === 'aspect') {
            operations.push(`crop(${settings.crop.aspectRatio})`);
          } else {
            operations.push(`crop(${cropParams.width}x${cropParams.height})`);
          }
        }
      } catch (cropError) {
        console.warn('Crop failed, continuing:', cropError);
      }
    }

    // 3. ROTATE/FLIP (after crop, before resize)
    if (settings.rotate?.enabled) {
      try {
        const rotateOps: string[] = [];

        // Apply rotation first
        if (settings.rotate.angle) {
          const rotateResult = await pipeline.rotate(settings.rotate.angle).toBuffer();
          processedBuffer = Buffer.from(rotateResult);
          pipeline = sharp(processedBuffer);
          rotateOps.push(`${settings.rotate.angle}°`);
        }

        // Apply horizontal flip (flop in sharp)
        if (settings.rotate.flipHorizontal) {
          const flopResult = await pipeline.flop().toBuffer();
          processedBuffer = Buffer.from(flopResult);
          pipeline = sharp(processedBuffer);
          rotateOps.push('flipH');
        }

        // Apply vertical flip
        if (settings.rotate.flipVertical) {
          const flipResult = await pipeline.flip().toBuffer();
          processedBuffer = Buffer.from(flipResult);
          pipeline = sharp(processedBuffer);
          rotateOps.push('flipV');
        }

        if (rotateOps.length > 0) {
          operations.push(`rotate(${rotateOps.join(',')})`);
        }
      } catch (rotateError) {
        console.warn('Rotate/flip failed, continuing:', rotateError);
      }
    }

    // 4. RESIZE (after trim, crop, and rotate)
    if (settings.resize?.enabled && (settings.resize.width || settings.resize.height)) {
      const resizeOptions: sharp.ResizeOptions = {
        fit: settings.resize.fit || 'inside',
        withoutEnlargement: settings.resize.withoutEnlargement ?? true,
      };

      if (settings.resize.width) resizeOptions.width = settings.resize.width;
      if (settings.resize.height) resizeOptions.height = settings.resize.height;

      const resizeResult = await pipeline.resize(resizeOptions).toBuffer();
      processedBuffer = Buffer.from(resizeResult);
      pipeline = sharp(processedBuffer);
      operations.push(`resize(${settings.resize.width || 'auto'}x${settings.resize.height || 'auto'})`);
    }

    // 5. OPTIMIZE & 6. CONVERT (combined for efficiency)
    const quality = settings.optimize?.enabled ? (settings.optimize.quality ?? 80) : 80;
    const outputFormat = settings.convert?.enabled ? settings.convert.format : null;
    let contentType = image.mime_type || 'image/png';
    let extension = image.filename.split('.').pop() || 'png';

    if (outputFormat) {
      // Convert to specified format
      let result: Buffer;
      switch (outputFormat) {
        case 'jpeg':
          result = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
          contentType = 'image/jpeg';
          extension = 'jpg';
          break;
        case 'png':
          result = await pipeline.png({ quality: Math.round(quality / 10), compressionLevel: 9 }).toBuffer();
          contentType = 'image/png';
          extension = 'png';
          break;
        case 'webp':
          result = await pipeline.webp({ quality }).toBuffer();
          contentType = 'image/webp';
          extension = 'webp';
          break;
        default:
          result = await pipeline.toBuffer();
      }
      processedBuffer = Buffer.from(result);
      operations.push(`convert(${outputFormat}, q=${quality})`);
    } else if (settings.optimize?.enabled) {
      // Optimize in current format
      const currentFormat = originalMetadata.format;
      let result: Buffer;
      switch (currentFormat) {
        case 'jpeg':
          result = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
          break;
        case 'png':
          result = await pipeline.png({ quality: Math.round(quality / 10), compressionLevel: 9 }).toBuffer();
          break;
        case 'webp':
          result = await pipeline.webp({ quality }).toBuffer();
          break;
        default:
          result = await pipeline.toBuffer();
      }
      processedBuffer = Buffer.from(result);
      operations.push(`optimize(q=${quality})`);
    } else {
      const result = await pipeline.toBuffer();
      processedBuffer = Buffer.from(result);
    }

    // Get final metadata
    const finalMetadata = await sharp(processedBuffer).metadata();
    console.log(`Final: ${finalMetadata.width}x${finalMetadata.height}, operations: ${operations.join(' → ')}`);

    // Generate processed filename
    const baseName = image.filename.replace(/\.[^/.]+$/, '');
    const suffix = operations.length > 0 ? '-processed' : '-trimmed';
    const processedFilename = `${baseName}${suffix}.${extension}`;
    const processedPath = `${userId}/${Date.now()}-${processedFilename}`;

    // Upload processed image
    const { error: uploadError } = await supabase.storage
      .from('processed')
      .upload(processedPath, processedBuffer, {
        contentType,
        cacheControl: '3600',
      });

    if (uploadError) {
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json(
        { error: `Failed to upload processed image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('processed')
      .getPublicUrl(processedPath);

    // Update database record
    const { error: updateError } = await supabase
      .from('images')
      .update({
        status: 'completed',
        processed_url: urlData.publicUrl,
        width: finalMetadata.width,
        height: finalMetadata.height,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update record: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image processed successfully',
      data: {
        id,
        processed_url: urlData.publicUrl,
        width: finalMetadata.width,
        height: finalMetadata.height,
        status: 'completed',
        operations,
        originalSize: arrayBuffer.byteLength,
        finalSize: processedBuffer.length,
        compressionRatio: Math.round((1 - processedBuffer.length / arrayBuffer.byteLength) * 100),
      },
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
