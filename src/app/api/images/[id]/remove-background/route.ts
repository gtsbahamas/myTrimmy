/**
 * Background Removal API - Server-side ML Processing
 *
 * POST /api/images/[id]/remove-background
 *
 * Uses Replicate's rembg model for high-quality background removal.
 * Uses direct API calls instead of SDK to avoid bundling issues on Vercel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | null;
  error?: string | null;
}

// Poll for prediction completion
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

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Prediction timed out');
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

    // Get user's profile to check for their own API key
    const { data: profile } = await supabase
      .from('profiles')
      .select('replicate_api_key')
      .eq('id', userId)
      .single();

    // Use user's API key if available, otherwise fall back to app's key
    const userApiKey = profile?.replicate_api_key;
    const apiToken = userApiKey || process.env.REPLICATE_API_TOKEN;
    const usingUserKey = !!userApiKey;

    // Check if any API token is available
    if (!apiToken) {
      return NextResponse.json(
        { error: 'Background removal service not configured. Please add your Replicate API key in Settings, or contact support.' },
        { status: 503 }
      );
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

    // Get the image URL (use processed if available, otherwise original)
    const imageUrl = image.processed_url || image.original_url;

    console.log(`Processing background removal for image: ${id}`);
    console.log(`Image URL: ${imageUrl}`);
    console.log(`Using ${usingUserKey ? "user's API key" : "app API key"}`);

    // Create prediction via Replicate API
    // Using cjwbw/rembg model
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
        input: {
          image: imageUrl,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Replicate API error:', errorText);
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json(
        { error: `Replicate API error: ${createResponse.status}` },
        { status: 500 }
      );
    }

    const prediction: ReplicatePrediction = await createResponse.json();
    console.log(`Created prediction: ${prediction.id}`);

    // Wait for prediction to complete
    const completedPrediction = await waitForPrediction(prediction.id, apiToken);

    if (!completedPrediction.output) {
      await supabase.from('images').update({ status: 'failed' }).eq('id', id);
      return NextResponse.json(
        { error: 'Background removal failed - no output from model' },
        { status: 500 }
      );
    }

    const outputUrl = completedPrediction.output;
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

    // Get image dimensions (dimensions remain the same after background removal)
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
