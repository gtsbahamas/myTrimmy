/**
 * Transparent Variant API
 *
 * GET /api/images/[id]/transparent?mode=light|dark
 *
 * Returns a transparent PNG variant of the image:
 * - light: Background removed, original colors (for light backgrounds)
 * - dark: Background removed + colors inverted (for dark backgrounds)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import {
  createTransparentLogo,
  createDarkModeVariant,
} from '@/lib/asset-generator/image-generator';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'light';

    if (mode !== 'light' && mode !== 'dark') {
      return NextResponse.json(
        { error: 'Invalid mode. Use "light" or "dark".' },
        { status: 400 }
      );
    }

    // Authenticate via session or API key
    const auth = await getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const supabase = auth.method === 'api_key'
      ? createServiceRoleClient()
      : await createClient();

    const userId = auth.userId;

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

    // Use processed URL if available, otherwise original
    const imageUrl = image.processed_url || image.original_url;

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
    }

    const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Create transparent variant
    let resultBuffer: Buffer;

    if (mode === 'light') {
      // Light mode: transparent background, original colors
      resultBuffer = await createTransparentLogo(originalBuffer);
    } else {
      // Dark mode: transparent background + inverted colors
      const transparentBuffer = await createTransparentLogo(originalBuffer);
      resultBuffer = await createDarkModeVariant(transparentBuffer);
    }

    // Generate filename
    const baseName = image.filename.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-transparent-${mode}.png`;

    // Return the image directly for download
    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': resultBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Transparent variant error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create transparent variant' },
      { status: 500 }
    );
  }
}
