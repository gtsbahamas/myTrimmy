/**
 * Asset Analyze API Route
 *
 * POST /api/assets/analyze
 *
 * Analyzes a source image and returns recommendations for asset generation.
 * Checks dimensions, format, and provides upscaling warnings.
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { analyzeSourceForUpscaling } from '@/lib/asset-generator';
import {
  MIN_SOURCE_SIZE,
  MAX_SOURCE_SIZE,
  ALLOWED_SOURCE_TYPES,
  IOS_ASSETS,
  ANDROID_ASSETS,
  WEB_ASSETS,
  SOCIAL_ASSETS,
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

    // 6. Read image and analyze
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: 'Unable to read image dimensions' },
        { status: 400 }
      );
    }

    // 7. Analyze for upscaling requirements
    const analysis = await analyzeSourceForUpscaling(imageBuffer);

    // 8. Check if image meets minimum requirements
    const meetsMinimum = Math.min(metadata.width, metadata.height) >= MIN_SOURCE_SIZE;

    // 9. Calculate platform-specific asset counts
    const platformSummary = {
      ios: {
        count: IOS_ASSETS.length,
        maxSize: Math.max(...IOS_ASSETS.map(a => a.width)),
        needsUpscaling: Math.min(metadata.width, metadata.height) < 1024,
      },
      android: {
        count: ANDROID_ASSETS.length,
        maxSize: Math.max(...ANDROID_ASSETS.map(a => a.width)),
        needsUpscaling: Math.min(metadata.width, metadata.height) < 512,
      },
      web: {
        count: WEB_ASSETS.length,
        maxSize: Math.max(...WEB_ASSETS.map(a => Math.max(a.width, a.height))),
        needsUpscaling: Math.min(metadata.width, metadata.height) < 512,
      },
      social: {
        count: SOCIAL_ASSETS.length,
        maxSize: Math.max(...SOCIAL_ASSETS.map(a => a.width)),
        needsUpscaling: Math.min(metadata.width, metadata.height) < 630,
      },
    };

    // 10. Return analysis
    return NextResponse.json({
      valid: meetsMinimum,
      image: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        aspectRatio: (metadata.width / metadata.height).toFixed(2),
        isSquare: Math.abs(metadata.width - metadata.height) < 10,
        fileSize: imageFile.size,
        fileSizeFormatted: `${(imageFile.size / 1024).toFixed(1)} KB`,
      },
      analysis: {
        maxOptimalSize: analysis.maxOptimalSize,
        maxAcceptableSize: analysis.maxAcceptableSize,
        recommendation: analysis.recommendation,
      },
      platforms: platformSummary,
      warnings: [
        ...analysis.warnings,
        ...(meetsMinimum ? [] : [`Source image is smaller than minimum required size (${MIN_SOURCE_SIZE}x${MIN_SOURCE_SIZE})`]),
        ...(metadata.width !== metadata.height ? ['Image is not square. Will be center-cropped for icons.'] : []),
      ],
    });
  } catch (error) {
    console.error('Asset analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}
