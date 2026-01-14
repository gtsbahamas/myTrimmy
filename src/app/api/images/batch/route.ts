/**
 * Batch Image Processing API
 *
 * POST /api/images/batch
 *
 * Processes multiple images in a batch with full pipeline:
 * Trim → Crop → Rotate/Flip → Resize → Optimize → Convert
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';

interface ProcessSettings {
  trim?: {
    enabled?: boolean;
    threshold?: number;
    lineArt?: boolean;
  };
  crop?: {
    enabled?: boolean;
    mode?: 'manual' | 'aspect';
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    aspectRatio?: string;
  };
  rotate?: {
    enabled?: boolean;
    angle?: 0 | 90 | 180 | 270;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
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

// Legacy support
interface LegacyTrimSettings {
  threshold?: number;
  lineArt?: boolean;
}

interface BatchRequest {
  imageIds: string[];
  presetId?: string;
  settings?: ProcessSettings | LegacyTrimSettings;
}

interface ProcessResult {
  id: string;
  success: boolean;
  processed_url?: string;
  width?: number;
  height?: number;
  originalSize?: number;
  finalSize?: number;
  error?: string;
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
    cropHeight = imageHeight;
    cropWidth = Math.round(cropHeight * targetRatio);
  } else {
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

async function processImage(
  inputBuffer: Buffer,
  settings: ProcessSettings,
  originalMimeType: string,
  originalFilename: string
): Promise<{ buffer: Buffer; contentType: string; extension: string; operations: string[] }> {
  let processedBuffer: Buffer = Buffer.from(inputBuffer);
  let pipeline = sharp(processedBuffer);
  const operations: string[] = [];

  // Get original metadata
  const originalMetadata = await sharp(processedBuffer).metadata();

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
      operations.push(`trim`);
    } catch {
      // Trim failed, continue with original
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
        const ratio = parseAspectRatio(settings.crop.aspectRatio);
        if (ratio && imgWidth && imgHeight) {
          cropParams = calculateAspectCrop(imgWidth, imgHeight, ratio.w, ratio.h);
        }
      } else if (settings.crop.width && settings.crop.height) {
        cropParams = {
          left: Math.max(0, settings.crop.left ?? 0),
          top: Math.max(0, settings.crop.top ?? 0),
          width: Math.min(settings.crop.width, imgWidth - (settings.crop.left ?? 0)),
          height: Math.min(settings.crop.height, imgHeight - (settings.crop.top ?? 0)),
        };
      }

      if (cropParams && cropParams.width > 0 && cropParams.height > 0) {
        const cropResult = await pipeline.extract(cropParams).toBuffer();
        processedBuffer = Buffer.from(cropResult);
        pipeline = sharp(processedBuffer);

        if (settings.crop.mode === 'aspect') {
          operations.push(`crop(${settings.crop.aspectRatio})`);
        } else {
          operations.push(`crop(${cropParams.width}x${cropParams.height})`);
        }
      }
    } catch {
      // Crop failed, continue
    }
  }

  // 3. ROTATE/FLIP
  if (settings.rotate?.enabled) {
    try {
      const rotateOps: string[] = [];

      if (settings.rotate.angle) {
        const rotateResult = await pipeline.rotate(settings.rotate.angle).toBuffer();
        processedBuffer = Buffer.from(rotateResult);
        pipeline = sharp(processedBuffer);
        rotateOps.push(`${settings.rotate.angle}°`);
      }

      if (settings.rotate.flipHorizontal) {
        const flopResult = await pipeline.flop().toBuffer();
        processedBuffer = Buffer.from(flopResult);
        pipeline = sharp(processedBuffer);
        rotateOps.push('flipH');
      }

      if (settings.rotate.flipVertical) {
        const flipResult = await pipeline.flip().toBuffer();
        processedBuffer = Buffer.from(flipResult);
        pipeline = sharp(processedBuffer);
        rotateOps.push('flipV');
      }

      if (rotateOps.length > 0) {
        operations.push(`rotate(${rotateOps.join(',')})`);
      }
    } catch {
      // Rotate/flip failed, continue
    }
  }

  // 4. RESIZE
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
    operations.push(`resize`);
  }

  // 5. OPTIMIZE & 6. CONVERT
  const quality = settings.optimize?.enabled ? (settings.optimize.quality ?? 80) : 80;
  const outputFormat = settings.convert?.enabled ? settings.convert.format : null;
  let contentType = originalMimeType || 'image/png';
  let extension = originalFilename.split('.').pop() || 'png';

  if (outputFormat) {
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
    operations.push(`convert(${outputFormat})`);
  } else if (settings.optimize?.enabled) {
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
    operations.push(`optimize`);
  } else {
    const result = await pipeline.toBuffer();
    processedBuffer = Buffer.from(result);
  }

  return { buffer: processedBuffer, contentType, extension, operations };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BatchRequest = await request.json();
    const { imageIds, presetId } = body;

    // Get settings from preset or request
    let settings: ProcessSettings = { ...DEFAULT_SETTINGS };

    if (presetId) {
      const { data: preset } = await supabase
        .from('presets')
        .select('settings')
        .eq('id', presetId)
        .eq('user_id', user.id)
        .single();

      if (preset?.settings) {
        if (isLegacySettings(preset.settings)) {
          settings = convertLegacySettings(preset.settings as LegacyTrimSettings);
        } else {
          settings = { ...DEFAULT_SETTINGS, ...preset.settings as ProcessSettings };
        }
      }
    }

    // Merge inline settings (override preset settings)
    if (body.settings && !isLegacySettings(body.settings)) {
      const inline = body.settings as ProcessSettings;
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
      settings = convertLegacySettings(body.settings);
    }

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'No image IDs provided' }, { status: 400 });
    }

    if (imageIds.length > 20) {
      return NextResponse.json({ error: 'Maximum batch size is 20 images' }, { status: 400 });
    }

    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .in('id', imageIds)
      .eq('user_id', user.id);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No valid images found' }, { status: 404 });
    }

    const results: ProcessResult[] = [];

    for (const image of images) {
      try {
        await supabase.from('images').update({ status: 'processing' }).eq('id', image.id);

        const storagePath = image.original_url.includes('/storage/v1/object/public/')
          ? image.original_url.split('/storage/v1/object/public/images/')[1]
          : `${user.id}/${image.original_url.split('/').pop()}`;

        const { data: fileData, error: downloadError } = await supabase.storage
          .from('images')
          .download(storagePath);

        if (downloadError || !fileData) {
          await supabase.from('images').update({ status: 'failed' }).eq('id', image.id);
          results.push({
            id: image.id,
            success: false,
            error: `Failed to download: ${downloadError?.message}`,
          });
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { buffer: processedBuffer, contentType, extension, operations } = await processImage(
          buffer,
          settings,
          image.mime_type || 'image/png',
          image.filename
        );

        const metadata = await sharp(processedBuffer).metadata();

        const baseName = image.filename.replace(/\.[^/.]+$/, '');
        const suffix = operations.length > 1 ? '-processed' : '-trimmed';
        const processedFilename = `${baseName}${suffix}.${extension}`;
        const processedPath = `${user.id}/${Date.now()}-${processedFilename}`;

        const { error: uploadError } = await supabase.storage
          .from('processed')
          .upload(processedPath, processedBuffer, {
            contentType,
            cacheControl: '3600',
          });

        if (uploadError) {
          await supabase.from('images').update({ status: 'failed' }).eq('id', image.id);
          results.push({
            id: image.id,
            success: false,
            error: `Failed to upload: ${uploadError.message}`,
          });
          continue;
        }

        const { data: urlData } = supabase.storage.from('processed').getPublicUrl(processedPath);

        await supabase
          .from('images')
          .update({
            status: 'completed',
            processed_url: urlData.publicUrl,
            width: metadata.width,
            height: metadata.height,
          })
          .eq('id', image.id);

        results.push({
          id: image.id,
          success: true,
          processed_url: urlData.publicUrl,
          width: metadata.width,
          height: metadata.height,
          originalSize: arrayBuffer.byteLength,
          finalSize: processedBuffer.length,
        });
      } catch (err) {
        await supabase.from('images').update({ status: 'failed' }).eq('id', image.id);
        results.push({
          id: image.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} images, ${failCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failCount,
        results,
      },
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch processing failed' },
      { status: 500 }
    );
  }
}
