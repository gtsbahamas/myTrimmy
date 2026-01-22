// src/app/api/video/quota/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { subscriptionRepository } from '@/lib/repositories/subscriptions';

export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const quota = await subscriptionRepository.canUserGenerateVideo(auth.userId);

    return NextResponse.json({
      used: quota.used,
      limit: quota.limit,
      plan: quota.plan,
      canGenerate: quota.canGenerate,
      remaining: quota.remaining,
    });
  } catch (error) {
    console.error('[/api/video/quota] Failed to get quota:', error);
    return NextResponse.json(
      { error: 'Failed to get quota' },
      { status: 500 }
    );
  }
}
