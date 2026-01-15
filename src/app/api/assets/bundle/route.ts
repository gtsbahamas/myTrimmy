/**
 * Asset Bundle API Route
 *
 * POST /api/assets/bundle
 *
 * Accepts a multipart form with:
 * - image: File (source logo, 512x512+)
 * - config: JSON string (app name, colors)
 *
 * Returns: ZIP file download
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { safeValidateAssetBundleInput } from '@/lib/validation/asset-bundle';
import { createAssetBundle, getAssetCount } from '@/lib/asset-generator';
import {
  MIN_SOURCE_SIZE,
  MAX_SOURCE_SIZE,
  ALLOWED_SOURCE_TYPES,
} from '@/types/asset-bundle';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const configJson = formData.get('config') as string | null;

    // 3. Validate image file presence
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // 4. Validate file type
    if (!ALLOWED_SOURCE_TYPES.includes(imageFile.type as typeof ALLOWED_SOURCE_TYPES[number])) {
      return NextResponse.json(
        {
          error: `Invalid image type: ${imageFile.type}. Allowed: PNG, JPEG, WebP, SVG`,
        },
        { status: 400 }
      );
    }

    // 5. Validate file size
    if (imageFile.size > MAX_SOURCE_SIZE) {
      return NextResponse.json(
        {
          error: `Image too large: ${(imageFile.size / 1024 / 1024).toFixed(1)}MB. Maximum: 10MB`,
        },
        { status: 400 }
      );
    }

    // 6. Validate and parse config
    let parsedConfig: Record<string, unknown> = {};
    if (configJson) {
      try {
        parsedConfig = JSON.parse(configJson);
      } catch {
        return NextResponse.json(
          { error: 'Invalid config JSON' },
          { status: 400 }
        );
      }
    }

    const validationResult = safeValidateAssetBundleInput(parsedConfig);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid configuration',
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const config = validationResult.data;

    // 7. Read and validate image dimensions
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: 'Unable to read image dimensions' },
        { status: 400 }
      );
    }

    if (metadata.width < MIN_SOURCE_SIZE || metadata.height < MIN_SOURCE_SIZE) {
      return NextResponse.json(
        {
          error: `Image too small: ${metadata.width}x${metadata.height}. Minimum: ${MIN_SOURCE_SIZE}x${MIN_SOURCE_SIZE}`,
        },
        { status: 400 }
      );
    }

    // 8. Generate the asset bundle
    const zipBuffer = await createAssetBundle(imageBuffer, config);

    // 9. Create filename from app name
    const safeFilename = config.appName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 10. Return ZIP file as download
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFilename}-assets.zip"`,
        'Content-Length': zipBuffer.length.toString(),
        'X-Asset-Count': getAssetCount().toString(),
      },
    });
  } catch (error) {
    console.error('Asset bundle generation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Asset bundle generation failed',
      },
      { status: 500 }
    );
  }
}
