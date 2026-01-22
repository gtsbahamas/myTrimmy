// src/app/api/video/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/supabase/server';
import { videoBundleRepository } from '@/lib/repositories/video-bundles';
import type { VideoBundleStatusResponse } from '@/types/video-bundle';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Authenticate
  const auth = await getAuthFromRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Get bundle (RLS ensures user can only see their own)
  const bundle = await videoBundleRepository.getById(id);
  if (!bundle) {
    return NextResponse.json({ error: 'Video bundle not found' }, { status: 404 });
  }

  // Calculate progress based on status
  const progressMap: Record<string, number> = {
    pending: 0,
    analyzing: 10,
    composing: 30,
    rendering: 50,
    validating: 80,
    reviewing: 90,
    completed: 100,
    failed: 0,
  };

  const stepMap: Record<string, string> = {
    pending: 'Queued',
    analyzing: 'Analyzing URL...',
    composing: 'Composing scenes...',
    rendering: 'Rendering videos...',
    validating: 'Validating quality...',
    reviewing: 'Final review...',
    completed: 'Complete',
    failed: 'Failed',
  };

  const response: VideoBundleStatusResponse = {
    id: bundle.id,
    status: bundle.status,
    progress: progressMap[bundle.status] ?? 0,
    currentStep: stepMap[bundle.status] ?? 'Unknown',
    outputs: bundle.outputs,
    error: bundle.error_message,
  };

  return NextResponse.json(response);
}
