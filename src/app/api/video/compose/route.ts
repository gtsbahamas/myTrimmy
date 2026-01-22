// src/app/api/video/compose/route.ts

import { NextResponse } from 'next/server';
import { composeVideoBundle } from '@/lib/services/composing';

// Environment variables for authentication
const FAL_WEBHOOK_SECRET = process.env.FAL_WEBHOOK_SECRET;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

interface ComposeRequest {
  bundleId: string;
  secret?: string;
}

/**
 * POST /api/video/compose
 *
 * Triggers video composition for a bundle:
 * 1. Generates video script via Claude
 * 2. Initiates Remotion Lambda renders for all 3 formats
 *
 * Authentication: FAL_WEBHOOK_SECRET or ADMIN_API_KEY
 */
export async function POST(request: Request) {
  try {
    const body: ComposeRequest = await request.json();
    const { bundleId, secret } = body;

    // Validate required fields
    if (!bundleId) {
      return NextResponse.json(
        { error: 'bundleId is required' },
        { status: 400 }
      );
    }

    // Authenticate request
    if (!isAuthorized(secret, request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[compose] Received compose request for bundle ${bundleId}`);

    // Trigger composition
    const result = await composeVideoBundle(bundleId);

    if (!result.success) {
      console.error(`[compose] Composition failed for bundle ${bundleId}: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log(`[compose] Composition succeeded for bundle ${bundleId}. Renders: ${result.renderIds.join(', ')}`);

    return NextResponse.json({
      success: true,
      scenesGenerated: result.scenesGenerated,
      renderIds: result.renderIds,
    });
  } catch (error) {
    console.error('[compose] Error processing compose request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if the request is authorized
 * Accepts FAL_WEBHOOK_SECRET or ADMIN_API_KEY
 */
function isAuthorized(secret: string | undefined, request: Request): boolean {
  // Check body secret against FAL_WEBHOOK_SECRET
  if (secret && FAL_WEBHOOK_SECRET && secret === FAL_WEBHOOK_SECRET) {
    return true;
  }

  // Check Authorization header for ADMIN_API_KEY
  const authHeader = request.headers.get('Authorization');
  if (authHeader && ADMIN_API_KEY) {
    const token = authHeader.replace('Bearer ', '');
    if (token === ADMIN_API_KEY) {
      return true;
    }
  }

  // Check X-API-Key header
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey && ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
    return true;
  }

  // For development, allow if no secrets are configured
  if (!FAL_WEBHOOK_SECRET && !ADMIN_API_KEY) {
    console.warn('[compose] No authentication configured, allowing request in development mode');
    return true;
  }

  return false;
}
