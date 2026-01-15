/**
 * Background Removal API - Server-side ML Processing
 *
 * POST /api/images/[id]/remove-background
 *
 * Uses Replicate's rembg model for high-quality background removal.
 * This replaces the client-side @imgly/background-removal which caused
 * issues with Vercel's edge runtime (WASM/multi-threading problems).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Replicate from 'replicate';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Background removal service not configured. Please add REPLICATE_API_TOKEN to environment variables.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the image record
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase.from('images').update({ status: 'processing' }).eq('id', id);

    // Get the image URL (use processed if available, otherwise original)
    const imageUrl = image.processed_url || image.original_url;

    console.log(`Processing background removal for image: ${id}`);
    console.log(`Image URL: ${imageUrl}`);

    // Call Replicate's rembg model
    // Using cjwbw/rembg - high quality open-source background removal
    const output = await replicate.run(
      "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
      {
        input: {
          image: imageUrl,
        }
      }
    );

    if (!output) {
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json(
        { error: 'Background removal failed - no output from model' },
        { status: 500 }
      );
    }

    // The output is a URL to the processed image (or a ReadableStream)
    // Replicate returns different types depending on the model
    let outputUrl: string;
    if (typeof output === 'string') {
      outputUrl = output;
    } else if (output && typeof output === 'object' && 'url' in output) {
      outputUrl = (output as { url: string }).url;
    } else {
      // Handle case where output might be an array or other format
      outputUrl = String(output);
    }
    console.log(`Replicate output URL: ${outputUrl}`);

    // Download the processed image from Replicate
    const processedResponse = await fetch(outputUrl);
    if (!processedResponse.ok) {
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json(
        { error: 'Failed to download processed image from Replicate' },
        { status: 500 }
      );
    }

    const processedBlob = await processedResponse.blob();
    const processedBuffer = Buffer.from(await processedBlob.arrayBuffer());

    // Generate filename for processed image
    const baseName = image.filename.replace(/\.[^/.]+$/, '');
    const processedFilename = `${baseName}-nobg.png`;
    const processedPath = `${user.id}/${Date.now()}-${processedFilename}`;

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

    // Get image dimensions (we can estimate from buffer size, or just use original)
    // The dimensions should remain the same after background removal
    const width = image.width;
    const height = image.height;

    // Update database record
    const { error: updateError } = await supabase
      .from('images')
      .update({
        status: 'completed',
        processed_url: urlData.publicUrl,
        width,
        height,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update record: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`Background removal completed for image: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Background removed successfully',
      data: {
        id,
        processed_url: urlData.publicUrl,
        width,
        height,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('Background removal error:', error);

    // Try to update status to failed
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
