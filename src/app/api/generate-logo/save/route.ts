/**
 * Save Generated Logo API - Download from OpenAI and save to Supabase
 *
 * POST /api/generate-logo/save
 *
 * Downloads the selected logo variation from OpenAI's temporary URL,
 * uploads it to Supabase storage, and creates an image record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import type { SaveLogoRequest } from '@/types/logo-generation';

export async function POST(request: NextRequest) {
  try {
    // Authenticate via session or API key
    const auth = await getAuthFromRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    // Use service role client for API key auth (bypasses RLS), otherwise regular client
    const supabase = auth.method === 'api_key'
      ? createServiceRoleClient()
      : await createClient();

    const userId = auth.userId;

    // Parse request body
    const body = await request.json() as SaveLogoRequest;
    const { variationId, temporaryUrl } = body;

    if (!variationId || !temporaryUrl) {
      return NextResponse.json(
        { success: false, error: 'variationId and temporaryUrl are required' },
        { status: 400 }
      );
    }

    // Validate the URL is from OpenAI
    if (!temporaryUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    console.log(`Saving logo variation ${variationId} for user ${userId}`);

    // Download the image from OpenAI's temporary URL
    const imageResponse = await fetch(temporaryUrl);
    if (!imageResponse.ok) {
      console.error('Failed to download image from OpenAI:', imageResponse.status);
      return NextResponse.json(
        { success: false, error: 'Failed to download the generated image. The link may have expired.' },
        { status: 500 }
      );
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

    // Generate filename
    const filename = `ai-logo-${Date.now()}.png`;
    const storagePath = `${userId}/${filename}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Failed to upload to storage:', uploadError);
      return NextResponse.json(
        { success: false, error: `Failed to save image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath);

    // Create image record
    const { data: imageRecord, error: insertError } = await supabase
      .from('images')
      .insert({
        user_id: userId,
        filename: filename,
        original_url: urlData.publicUrl,
        mime_type: 'image/png',
        file_size: imageBuffer.length,
        width: 1024, // DALL-E 3 generates 1024x1024
        height: 1024,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !imageRecord) {
      console.error('Failed to create image record:', insertError);
      // Try to clean up the uploaded file
      await supabase.storage.from('images').remove([storagePath]);
      return NextResponse.json(
        { success: false, error: 'Failed to create image record' },
        { status: 500 }
      );
    }

    console.log(`Saved logo as image ${imageRecord.id}`);

    return NextResponse.json({
      success: true,
      image: {
        id: imageRecord.id,
        original_url: imageRecord.original_url,
        filename: imageRecord.filename,
        status: imageRecord.status,
      },
    });
  } catch (error) {
    console.error('Save logo error:', error);

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save logo' },
      { status: 500 }
    );
  }
}
