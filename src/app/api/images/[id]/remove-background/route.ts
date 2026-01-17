/**
 * Background Removal API - Hybrid Approach
 *
 * POST /api/images/[id]/remove-background
 *
 * Uses a hybrid approach optimized for logos:
 * 1. Detect if background is a solid color (via corner sampling)
 * 2. If solid → Use Sharp color-based removal (preserves text perfectly)
 * 3. If complex → Fall back to BiRefNet AI model on Replicate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import sharp from 'sharp';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | null;
  error?: string | null;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Color distance threshold for considering colors "similar"
const COLOR_SIMILARITY_THRESHOLD = 30;
// Tolerance for background color removal (how close a pixel must be to bg color)
const REMOVAL_TOLERANCE = 40;

/**
 * Calculate Euclidean distance between two RGB colors
 */
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * Check if all colors in an array are similar (solid background detection)
 */
function areColorsSimilar(colors: RGB[], threshold: number): boolean {
  if (colors.length < 2) return true;

  const reference = colors[0];
  return colors.every(color => colorDistance(color, reference) < threshold);
}

/**
 * Sample corner pixels from an image to detect background color
 * Returns the detected background color if solid, null if complex
 */
async function detectSolidBackground(imageBuffer: Buffer): Promise<RGB | null> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    return null;
  }

  const width = metadata.width;
  const height = metadata.height;

  // Sample size from each corner (e.g., 5x5 pixel area)
  const sampleSize = 5;
  const cornerSamples: RGB[] = [];

  // Get raw pixel data
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;

  // Helper to get pixel color at (x, y)
  const getPixel = (x: number, y: number): RGB => {
    const idx = (y * width + x) * channels;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
    };
  };

  // Sample from all four corners
  const corners = [
    { startX: 0, startY: 0 }, // Top-left
    { startX: width - sampleSize, startY: 0 }, // Top-right
    { startX: 0, startY: height - sampleSize }, // Bottom-left
    { startX: width - sampleSize, startY: height - sampleSize }, // Bottom-right
  ];

  for (const corner of corners) {
    for (let dy = 0; dy < sampleSize; dy++) {
      for (let dx = 0; dx < sampleSize; dx++) {
        const x = Math.max(0, Math.min(width - 1, corner.startX + dx));
        const y = Math.max(0, Math.min(height - 1, corner.startY + dy));
        cornerSamples.push(getPixel(x, y));
      }
    }
  }

  // Check if all corner samples are similar
  if (areColorsSimilar(cornerSamples, COLOR_SIMILARITY_THRESHOLD)) {
    // Calculate average color
    const avgColor: RGB = {
      r: Math.round(cornerSamples.reduce((sum, c) => sum + c.r, 0) / cornerSamples.length),
      g: Math.round(cornerSamples.reduce((sum, c) => sum + c.g, 0) / cornerSamples.length),
      b: Math.round(cornerSamples.reduce((sum, c) => sum + c.b, 0) / cornerSamples.length),
    };
    return avgColor;
  }

  return null;
}

/**
 * Remove solid color background using Sharp
 * Makes pixels similar to bgColor transparent
 */
async function removeColorBackground(
  imageBuffer: Buffer,
  bgColor: RGB,
  tolerance: number
): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const outputData = Buffer.from(data);

  // Process each pixel
  for (let i = 0; i < data.length; i += channels) {
    const pixelColor: RGB = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    };

    const distance = colorDistance(pixelColor, bgColor);

    if (distance < tolerance) {
      // Make pixel fully transparent
      outputData[i + 3] = 0;
    } else if (distance < tolerance * 1.5) {
      // Partial transparency for anti-aliased edges
      const alpha = Math.min(255, Math.round(((distance - tolerance) / (tolerance * 0.5)) * 255));
      outputData[i + 3] = Math.min(outputData[i + 3], alpha);
    }
  }

  return sharp(outputData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Poll for Replicate prediction completion
 */
async function waitForPrediction(
  predictionId: string,
  apiToken: string,
  maxWaitMs = 120000
): Promise<ReplicatePrediction> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get prediction status: ${response.status}`);
    }

    const prediction: ReplicatePrediction = await response.json();

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Prediction timed out');
}

/**
 * Remove background using BiRefNet AI model (for complex backgrounds)
 */
async function removeBackgroundWithAI(
  imageUrl: string,
  apiToken: string
): Promise<Buffer> {
  // Use BiRefNet model - better accuracy than rembg
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // BiRefNet model - better edge preservation
      version: 'f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7',
      input: {
        image: imageUrl,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
  }

  const prediction: ReplicatePrediction = await createResponse.json();
  console.log(`Created BiRefNet prediction: ${prediction.id}`);

  const completedPrediction = await waitForPrediction(prediction.id, apiToken);

  if (!completedPrediction.output) {
    throw new Error('BiRefNet returned no output');
  }

  const outputUrl = completedPrediction.output;
  console.log(`BiRefNet output URL: ${outputUrl}`);

  const processedResponse = await fetch(outputUrl);
  if (!processedResponse.ok) {
    throw new Error('Failed to download processed image from Replicate');
  }

  const processedBlob = await processedResponse.blob();
  return Buffer.from(await processedBlob.arrayBuffer());
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

    // Update status to processing
    await supabase.from('images').update({ status: 'processing' }).eq('id', id);

    const imageUrl = image.processed_url || image.original_url;
    console.log(`Processing background removal for image: ${id}`);
    console.log(`Image URL: ${imageUrl}`);

    // Download the image first to analyze it
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
    }

    const originalBuffer = Buffer.from(await imageResponse.arrayBuffer());
    let processedBuffer: Buffer;
    let method: 'color' | 'ai';

    // Detect if background is solid color
    const solidBgColor = await detectSolidBackground(originalBuffer);

    if (solidBgColor) {
      // Solid background detected - use color-based removal (preserves text)
      console.log(`Detected solid background: RGB(${solidBgColor.r}, ${solidBgColor.g}, ${solidBgColor.b})`);
      console.log('Using color-based removal (preserves text/logos)');
      method = 'color';

      processedBuffer = await removeColorBackground(originalBuffer, solidBgColor, REMOVAL_TOLERANCE);
    } else {
      // Complex background - need AI model
      console.log('Complex background detected - using BiRefNet AI');
      method = 'ai';

      // Get user's Replicate API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('replicate_api_key')
        .eq('id', userId)
        .single();

      const apiToken = profile?.replicate_api_key || process.env.REPLICATE_API_TOKEN;

      if (!apiToken) {
        await supabase.from('images').update({ status: 'failed' }).eq('id', id);
        return NextResponse.json(
          { error: 'Background removal service not configured. Please add your Replicate API key in Settings.' },
          { status: 503 }
        );
      }

      processedBuffer = await removeBackgroundWithAI(imageUrl, apiToken);
    }

    // Generate filename for processed image
    const baseName = image.filename.replace(/\.[^/.]+$/, '');
    const processedFilename = `${baseName}-nobg.png`;
    const processedPath = `${userId}/${Date.now()}-${processedFilename}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('processed')
      .upload(processedPath, processedBuffer, {
        contentType: 'image/png',
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

    // Get dimensions from processed image
    const processedMetadata = await sharp(processedBuffer).metadata();

    // Update database record
    const { error: updateError } = await supabase
      .from('images')
      .update({
        status: 'completed',
        processed_url: urlData.publicUrl,
        width: processedMetadata.width || image.width,
        height: processedMetadata.height || image.height,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update record: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`Background removal completed for image: ${id} (method: ${method})`);

    return NextResponse.json({
      success: true,
      message: `Background removed successfully (${method === 'color' ? 'color-based' : 'AI-based'})`,
      data: {
        id,
        processed_url: urlData.publicUrl,
        width: processedMetadata.width || image.width,
        height: processedMetadata.height || image.height,
        status: 'completed',
        method,
      },
    });
  } catch (error) {
    console.error('Background removal error:', error);

    try {
      const { id } = await params;
      const supabase = await createClient();
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Background removal failed' },
      { status: 500 }
    );
  }
}
