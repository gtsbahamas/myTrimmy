/**
 * Logo Generation API - AI-powered logo generation using DALL-E 3
 *
 * POST /api/generate-logo
 *
 * Uses OpenAI's DALL-E 3 model to generate 3 logo variations.
 * Supports BYOK (Bring Your Own Key) pattern.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient, getAuthFromRequest } from '@/lib/supabase/server';
import { enhancePrompt, type GenerateLogoRequest, type LogoVariation, type LogoStyle } from '@/types/logo-generation';

interface OpenAIImageResponse {
  created: number;
  data: Array<{
    url?: string;
    revised_prompt?: string;
    b64_json?: string;
  }>;
}

interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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
    const body = await request.json() as GenerateLogoRequest;
    const { prompt, style } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required', code: 'invalid_request' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be less than 1000 characters', code: 'invalid_request' },
        { status: 400 }
      );
    }

    // Get user's profile to check for their own API key
    const { data: profile } = await supabase
      .from('profiles')
      .select('openai_api_key')
      .eq('id', userId)
      .single();

    // Use user's API key if available, otherwise fall back to app's key
    const userApiKey = profile?.openai_api_key;
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Logo generation service not configured. Please add your OpenAI API key in Settings.',
          code: 'no_api_key',
        },
        { status: 503 }
      );
    }

    // Enhance the prompt with logo-specific context
    const enhancedPrompt = enhancePrompt(prompt, style as LogoStyle);
    console.log(`Generating logo for user ${userId}`);
    console.log(`Original prompt: ${prompt}`);
    console.log(`Enhanced prompt: ${enhancedPrompt}`);
    console.log(`Using ${userApiKey ? "user's API key" : "app API key"}`);

    // DALL-E 3 only supports n=1, so we make 3 parallel calls
    const generationPromises = [0, 1, 2].map(async (index): Promise<LogoVariation | null> => {
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: enhancedPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'url',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json() as OpenAIError;
          console.error(`DALL-E generation ${index} failed:`, errorData);

          // Check for specific error types
          if (errorData.error?.code === 'content_policy_violation') {
            throw new Error('content_policy');
          }
          if (response.status === 429) {
            throw new Error('rate_limit');
          }
          throw new Error(errorData.error?.message || 'Generation failed');
        }

        const data = await response.json() as OpenAIImageResponse;
        const imageUrl = data.data[0]?.url;

        if (!imageUrl) {
          console.error(`DALL-E generation ${index} returned no URL`);
          return null;
        }

        return {
          id: `var-${Date.now()}-${index}`,
          temporaryUrl: imageUrl,
          index,
        };
      } catch (error) {
        console.error(`DALL-E generation ${index} error:`, error);
        // Re-throw specific errors to be handled at the top level
        if (error instanceof Error && ['content_policy', 'rate_limit'].includes(error.message)) {
          throw error;
        }
        return null;
      }
    });

    // Wait for all generations
    let variations: (LogoVariation | null)[];
    try {
      variations = await Promise.all(generationPromises);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'content_policy') {
          return NextResponse.json(
            {
              success: false,
              error: 'Your prompt was rejected due to content policy. Please try a different description.',
              code: 'content_policy',
            },
            { status: 400 }
          );
        }
        if (error.message === 'rate_limit') {
          return NextResponse.json(
            {
              success: false,
              error: 'Rate limit exceeded. Please wait a moment and try again.',
              code: 'rate_limit',
            },
            { status: 429 }
          );
        }
      }
      throw error;
    }

    // Filter out failed generations
    const successfulVariations = variations.filter((v): v is LogoVariation => v !== null);

    if (successfulVariations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate any logo variations. Please try again.',
          code: 'api_error',
        },
        { status: 500 }
      );
    }

    const durationMs = Date.now() - startTime;
    console.log(`Generated ${successfulVariations.length} variations in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      variations: successfulVariations,
      meta: {
        model: 'dall-e-3',
        promptUsed: enhancedPrompt,
        durationMs,
      },
    });
  } catch (error) {
    console.error('Logo generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Logo generation failed',
        code: 'api_error',
      },
      { status: 500 }
    );
  }
}
