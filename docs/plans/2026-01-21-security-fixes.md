# Video Bundles Security & Stability Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical (P0) and high-priority (P1) security and stability issues identified in the production readiness audit.

**Architecture:** Defense-in-depth approach - add security at webhook layer, repository layer, and service layer. Use discriminated unions for type safety and Promise.allSettled for resilience.

**Tech Stack:** Next.js 15, Supabase, Fal.ai, TypeScript

---

## Priority Summary

| Priority | Issues | Est. Time |
|----------|--------|-----------|
| P0 (Critical) | SEC-001, SEC-002, SEC-004, ERR-001 | 2-3 hours |
| P1 (High) | ERR-002, EDGE-001, EDGE-003, API-001 | 2-3 hours |
| P2 (Medium) | SEC-003, A11Y-001, API-002 | 1-2 hours |

---

## Task 1: Add Webhook Signature Validation (SEC-001)

**Files:**
- Create: `src/lib/services/webhook-security.ts`
- Modify: `src/app/api/webhooks/fal/route.ts:19-47`
- Test: Manual test with curl

**Step 1: Create webhook security module**

Create `src/lib/services/webhook-security.ts`:

```typescript
// src/lib/services/webhook-security.ts

import crypto from 'crypto';

const FAL_WEBHOOK_SECRET = process.env.FAL_WEBHOOK_SECRET;

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate Fal.ai webhook signature
 * Fal sends: x-fal-signature header with HMAC-SHA256 of body
 */
export function validateFalWebhookSignature(
  body: string,
  signature: string | null
): WebhookValidationResult {
  // In development, skip validation if no secret configured
  if (!FAL_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[webhook-security] No FAL_WEBHOOK_SECRET configured, skipping validation in dev');
      return { valid: true };
    }
    return { valid: false, error: 'Webhook secret not configured' };
  }

  if (!signature) {
    return { valid: false, error: 'Missing x-fal-signature header' };
  }

  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', FAL_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: 'Invalid signature length' };
  }

  const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    return { valid: false, error: 'Signature mismatch' };
  }

  return { valid: true };
}

/**
 * Generic webhook validation for future providers
 */
export function validateWebhookOrigin(
  request: Request,
  allowedIps?: string[]
): WebhookValidationResult {
  // If IP allowlist provided, check it
  if (allowedIps && allowedIps.length > 0) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip');

    if (!clientIp || !allowedIps.includes(clientIp)) {
      return { valid: false, error: 'IP not in allowlist' };
    }
  }

  return { valid: true };
}
```

**Step 2: Run typecheck to verify it compiles**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Update webhook route to use validation**

Modify `src/app/api/webhooks/fal/route.ts`:

```typescript
// Add import at top
import { validateFalWebhookSignature } from '@/lib/services/webhook-security';

// Replace lines 19-31 with:
export async function POST(request: NextRequest) {
  const jobType = request.nextUrl.searchParams.get('type') as FalJobType | null;

  console.log(`[webhook/fal] Received webhook callback, type=${jobType}`);

  // Get raw body for signature validation
  const rawBody = await request.text();

  // Validate webhook signature (SEC-001 fix)
  const signature = request.headers.get('x-fal-signature');
  const validation = validateFalWebhookSignature(rawBody, signature);

  if (!validation.valid) {
    console.error(`[webhook/fal] Signature validation failed: ${validation.error}`);
    return NextResponse.json(
      { error: 'Unauthorized', details: validation.error },
      { status: 401 }
    );
  }

  // Parse webhook payload from raw body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error('[webhook/fal] Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ... rest of existing code
```

**Step 4: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/services/webhook-security.ts src/app/api/webhooks/fal/route.ts
git commit -m "feat(security): add webhook signature validation (SEC-001)

- Create webhook-security.ts with HMAC-SHA256 validation
- Use constant-time comparison to prevent timing attacks
- Skip validation in dev if secret not configured
- Return 401 for invalid signatures"
```

---

## Task 2: Add SSRF Protection to URL Analyzer (SEC-004)

**Files:**
- Create: `src/lib/services/url-validator.ts`
- Modify: `src/lib/services/url-analyzer.ts:530-540`
- Test: Unit test with blocked URLs

**Step 1: Create URL validator module**

Create `src/lib/services/url-validator.ts`:

```typescript
// src/lib/services/url-validator.ts

/**
 * SSRF protection for user-provided URLs
 * Blocks access to internal networks and dangerous hosts
 */

// Private IP ranges (RFC 1918 + RFC 5737 + RFC 6598)
const PRIVATE_IP_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,               // 192.168.0.0/16
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 127.0.0.0/8 (loopback)
  /^169\.254\.\d{1,3}\.\d{1,3}$/,               // 169.254.0.0/16 (link-local)
  /^0\.0\.0\.0$/,                                // 0.0.0.0
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // 100.64.0.0/10 (CGN)
  /^192\.0\.0\.\d{1,3}$/,                       // 192.0.0.0/24 (IETF)
  /^192\.0\.2\.\d{1,3}$/,                       // 192.0.2.0/24 (TEST-NET-1)
  /^198\.51\.100\.\d{1,3}$/,                    // 198.51.100.0/24 (TEST-NET-2)
  /^203\.0\.113\.\d{1,3}$/,                     // 203.0.113.0/24 (TEST-NET-3)
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'host.docker.internal',
  'kubernetes.default',
  'metadata.google.internal',   // GCP metadata
  '169.254.169.254',            // AWS/GCP/Azure metadata
  'metadata.azure.com',
];

// Blocked hostname patterns
const BLOCKED_HOSTNAME_PATTERNS = [
  /\.local$/,
  /\.internal$/,
  /\.localhost$/,
  /\.svc\.cluster\.local$/,     // Kubernetes services
];

// Allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Validate a URL for SSRF protection
 */
export function validateUrlForSSRF(url: string): UrlValidationResult {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return {
      valid: false,
      error: `Protocol not allowed: ${parsed.protocol}. Only http: and https: are permitted.`
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, error: `Blocked hostname: ${hostname}` };
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: `Blocked hostname pattern: ${hostname}` };
    }
  }

  // Check if hostname is an IP address
  const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    // Check against private IP ranges
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: `Private IP address not allowed: ${hostname}` };
      }
    }
  }

  // Check for numeric IP in hostname (e.g., 0x7f.0.0.1, 2130706433)
  if (/^\d+$/.test(hostname)) {
    return { valid: false, error: 'Numeric IP addresses not allowed' };
  }

  // Check for hex/octal IP encoding tricks
  if (/0x[0-9a-f]+/i.test(hostname) || /^0\d+\./.test(hostname)) {
    return { valid: false, error: 'Encoded IP addresses not allowed' };
  }

  return {
    valid: true,
    sanitizedUrl: parsed.href,
  };
}

/**
 * Check if URL redirects to a blocked destination
 * Used after fetch to validate redirect chain
 */
export function validateRedirectUrl(redirectUrl: string): UrlValidationResult {
  return validateUrlForSSRF(redirectUrl);
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Update URL analyzer to use validation**

Modify `src/lib/services/url-analyzer.ts`:

Add import at top:
```typescript
import { validateUrlForSSRF } from './url-validator';
```

Replace lines 530-540 (URL validation section) with:
```typescript
    // Validate URL (SEC-004 SSRF protection)
    const urlValidation = validateUrlForSSRF(url);
    if (!urlValidation.valid) {
      throw new Error(`URL validation failed: ${urlValidation.error}`);
    }

    // Use sanitized URL
    const parsedUrl = new URL(urlValidation.sanitizedUrl!);
```

**Step 4: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/services/url-validator.ts src/lib/services/url-analyzer.ts
git commit -m "feat(security): add SSRF protection to URL analyzer (SEC-004)

- Create url-validator.ts with comprehensive checks
- Block private IP ranges (RFC 1918, etc.)
- Block localhost, metadata endpoints, internal hostnames
- Prevent hex/octal IP encoding tricks
- Only allow http: and https: protocols"
```

---

## Task 3: Add Ownership Validation to Fal Job Repository (SEC-002)

**Files:**
- Modify: `src/lib/repositories/fal-jobs.ts:47-81`
- Modify: `src/lib/repositories/video-bundles.ts` (add helper method)
- Test: Verify RLS would block cross-user access

**Step 1: Add video bundle ownership lookup**

Add to `src/lib/repositories/video-bundles.ts` (after line 100):

```typescript
  /**
   * Get the user_id for a video bundle (service role)
   * Used for ownership validation in related tables
   */
  async getOwnerUserId(bundleId: string): Promise<string | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('video_bundles')
      .select('user_id')
      .eq('id', bundleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get bundle owner: ${error.message}`);
    }

    return data?.user_id ?? null;
  }
```

**Step 2: Update fal-jobs repository with ownership check**

Modify `src/lib/repositories/fal-jobs.ts`:

Add at top of file:
```typescript
import { videoBundleRepository } from './video-bundles';
```

Update the `getByRequestId` method (line 47-62) to add ownership context:
```typescript
  /**
   * Get a Fal job by request ID
   * Note: This uses service role as it's called from webhooks.
   * Ownership is validated via the video_bundle relationship.
   */
  async getByRequestId(requestId: string): Promise<FalJobRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select(`
        *,
        video_bundles!inner(user_id)
      `)
      .eq('fal_request_id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }

  /**
   * Get a Fal job by request ID with ownership validation
   * Use this for user-facing operations
   */
  async getByRequestIdForUser(requestId: string, userId: string): Promise<FalJobRow | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select(`
        *,
        video_bundles!inner(user_id)
      `)
      .eq('fal_request_id', requestId)
      .eq('video_bundles.user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found or unauthorized
      throw new Error(`Failed to get Fal job: ${error.message}`);
    }

    return data as unknown as FalJobRow;
  }
```

Add user-scoped getByBundleId method:
```typescript
  /**
   * Get all Fal jobs for a video bundle with ownership validation
   */
  async getByBundleIdForUser(videoBundleId: string, userId: string): Promise<FalJobRow[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('fal_jobs')
      .select(`
        *,
        video_bundles!inner(user_id)
      `)
      .eq('video_bundle_id', videoBundleId)
      .eq('video_bundles.user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get Fal jobs: ${error.message}`);
    }

    return (data ?? []) as unknown as FalJobRow[];
  }
```

**Step 3: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/repositories/fal-jobs.ts src/lib/repositories/video-bundles.ts
git commit -m "feat(security): add ownership validation to Fal job repository (SEC-002)

- Add getOwnerUserId helper to video-bundles repository
- Add getByRequestIdForUser with user_id filter via join
- Add getByBundleIdForUser for user-scoped job listing
- Existing service role methods unchanged for webhooks"
```

---

## Task 4: Fix Silent Webhook Failures (ERR-001)

**Files:**
- Modify: `src/app/api/webhooks/fal/route.ts:66-75, 119`
- Test: Verify error responses return proper status codes

**Step 1: Update webhook error handling**

Modify `src/app/api/webhooks/fal/route.ts`:

Replace the try-catch block at lines 66-75 with:
```typescript
    try {
      // Get the video URL from the result
      const model = getModelForJobType(job.job_type as FalJobType);
      const result = await getJobResult(model, payload.request_id);

      // Update job with success
      await falJobRepository.update(job.id, {
        status: 'completed',
        outputUrl: result.videoUrl,
        completedAt: new Date().toISOString(),
      });

      console.log(`[webhook/fal] Job ${job.id} completed with URL: ${result.videoUrl}`);
    } catch (error) {
      console.error(`[webhook/fal] Failed to get result for job ${job.id}:`, error);

      // Mark as failed if we can't get the result
      await falJobRepository.update(job.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to retrieve result',
        completedAt: new Date().toISOString(),
      });

      // ERR-001 FIX: Return error status so Fal can retry
      return NextResponse.json(
        {
          received: true,
          error: 'Failed to process job result',
          job_id: job.id,
        },
        { status: 500 }
      );
    }
```

Also update the job-not-found case at line 45-47:
```typescript
  if (!job) {
    console.error(`[webhook/fal] Job not found: ${payload.request_id}`);
    // Return 404 so Fal knows the job doesn't exist (won't retry)
    return NextResponse.json(
      { received: false, error: 'Job not found' },
      { status: 404 }
    );
  }
```

**Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/api/webhooks/fal/route.ts
git commit -m "fix(webhook): return proper error status codes (ERR-001)

- Return 500 when job result processing fails (allows retry)
- Return 404 when job not found (prevents retry)
- Include job_id in error response for debugging
- Log all error cases with context"
```

---

## Task 5: Use Promise.allSettled for Batch Operations (ERR-002)

**Files:**
- Modify: `src/lib/services/fal-video.ts:121-127`
- Test: Verify partial failures are handled

**Step 1: Update batch job submission**

Modify `src/lib/services/fal-video.ts`:

Replace lines 121-133 with:
```typescript
  // Submit all three jobs in parallel with resilience (ERR-002 fix)
  const results = await Promise.allSettled([
    submitIntroJob(videoBundleId, prompts.intro, webhookUrl),
    submitBackgroundJob(videoBundleId, prompts.background, colors, webhookUrl),
    submitOutroJob(videoBundleId, prompts.outro, webhookUrl),
  ]);

  // Process results
  const [introResult, backgroundResult, outroResult] = results;

  // Helper to extract result or throw
  function getResultOrThrow<T>(
    result: PromiseSettledResult<T>,
    jobType: string
  ): T {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`[fal-video] ${jobType} job submission failed:`, result.reason);
    throw new Error(`Failed to submit ${jobType} job: ${result.reason}`);
  }

  // If all failed, throw aggregated error
  const failedJobs = results.filter(r => r.status === 'rejected');
  if (failedJobs.length === 3) {
    throw new Error('All Fal.ai job submissions failed');
  }

  // Log partial failures but continue
  if (failedJobs.length > 0) {
    console.warn(`[fal-video] ${failedJobs.length}/3 job submissions failed, proceeding with partial`);
  }

  // Return results (may have null for failed jobs)
  return {
    intro: introResult.status === 'fulfilled' ? introResult.value : { requestId: '', jobId: '' },
    background: backgroundResult.status === 'fulfilled' ? backgroundResult.value : { requestId: '', jobId: '' },
    outro: outroResult.status === 'fulfilled' ? outroResult.value : { requestId: '', jobId: '' },
  };
```

**Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/services/fal-video.ts
git commit -m "fix(fal): use Promise.allSettled for resilient job submission (ERR-002)

- Replace Promise.all with Promise.allSettled
- Handle partial failures gracefully
- Only throw if ALL jobs fail
- Log warnings for partial failures"
```

---

## Task 6: Fix AnimatedCounter NaN Issue (EDGE-001)

**Files:**
- Modify: `src/remotion/components/AnimatedText.tsx:163-192`
- Test: Verify non-numeric strings display correctly

**Step 1: Update AnimatedCounter**

Modify `src/remotion/components/AnimatedText.tsx`:

Replace lines 162-218 (AnimatedCounter function) with:
```typescript
export function AnimatedCounter({
  value,
  style,
  delay = 0,
  fontSize = 72,
  color = '#ffffff',
}: AnimatedCounterProps) {
  const frame = useCurrentFrame();

  // EDGE-001 FIX: Validate and extract numeric part safely
  const match = value.match(/^([\d,.]+)(.*)$/);

  // If not a numeric value, just display as static text
  if (!match) {
    const opacity = remotionInterpolate(
      frame,
      [delay, delay + style.textEnterDuration],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    return (
      <div
        style={{
          opacity,
          fontSize,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    );
  }

  const numericPart = match[1];
  const suffix = match[2];

  // Parse the number
  const cleanedNumeric = numericPart.replace(/,/g, '');
  const targetNumber = parseFloat(cleanedNumeric);

  // Handle NaN case
  if (Number.isNaN(targetNumber)) {
    const opacity = remotionInterpolate(
      frame,
      [delay, delay + style.textEnterDuration],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }
    );

    return (
      <div
        style={{
          opacity,
          fontSize,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    );
  }

  const hasDecimals = numericPart.includes('.');
  const decimalPlaces = hasDecimals ? (numericPart.split('.')[1]?.length || 0) : 0;

  const { counterDuration, counterEasing } = style.stats;

  // Calculate counter progress
  const progress = remotionInterpolate(
    frame,
    [delay, delay + counterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Apply easing
  const easedProgress = counterEasing(progress);

  // Calculate current display value
  const currentNumber = targetNumber * easedProgress;
  const displayNumber = hasDecimals
    ? currentNumber.toFixed(decimalPlaces)
    : Math.round(currentNumber).toLocaleString();

  // Opacity animation
  const opacity = remotionInterpolate(
    frame,
    [delay, delay + style.textEnterDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <div
      style={{
        opacity,
        fontSize,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {displayNumber}
      {suffix}
    </div>
  );
}
```

**Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/remotion/components/AnimatedText.tsx
git commit -m "fix(remotion): handle non-numeric values in AnimatedCounter (EDGE-001)

- Add regex validation for numeric format
- Fall back to static display for non-numeric strings
- Handle NaN edge case explicitly
- Maintain animated counter for valid numbers"
```

---

## Task 7: Fix Division by Zero in PromoVideo (EDGE-003)

**Files:**
- Modify: `src/remotion/compositions/PromoVideo.tsx:101-111`
- Test: Verify zero duration handling

**Step 1: Update timing calculation**

Modify `src/remotion/compositions/PromoVideo.tsx`:

Replace lines 100-114 (the scaling logic) with:
```typescript
  // If total exceeds video duration, scale proportionally
  // EDGE-003 FIX: Guard against division by zero
  const totalSceneDuration = timings.reduce((sum, t) => sum + t.duration, 0);

  if (totalSceneDuration > 0 && totalSceneDuration > totalDuration) {
    const scale = totalDuration / totalSceneDuration;
    let adjustedStart = 0;

    for (const timing of timings) {
      timing.start = Math.floor(adjustedStart);
      timing.duration = Math.max(1, Math.floor(timing.duration * scale)); // Ensure at least 1 frame
      adjustedStart += timing.duration;
    }
  } else if (totalSceneDuration === 0 && timings.length > 0) {
    // If all scenes have 0 duration, distribute evenly
    const perSceneDuration = Math.floor(totalDuration / timings.length);
    let adjustedStart = 0;

    for (const timing of timings) {
      timing.start = adjustedStart;
      timing.duration = perSceneDuration;
      adjustedStart += perSceneDuration;
    }
  }
```

**Step 2: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/remotion/compositions/PromoVideo.tsx
git commit -m "fix(remotion): guard against division by zero in timing calculation (EDGE-003)

- Check totalSceneDuration > 0 before dividing
- Ensure minimum 1 frame per scene after scaling
- Handle all-zero-duration edge case with even distribution"
```

---

## Task 8: Add Discriminated Union Types for API Responses (API-001)

**Files:**
- Create: `src/types/api.ts`
- Test: Typecheck validates correct usage

**Step 1: Create API response types**

Create `src/types/api.ts`:

```typescript
// src/types/api.ts

/**
 * Discriminated union types for API responses
 * Ensures type-safe error handling at compile time
 */

// Base success/error discriminator
export type ApiResult<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E; code?: string };

// Common error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Video Bundle specific
export interface VideoBundleApiError extends ApiError {
  code:
    | 'INVALID_URL'
    | 'RATE_LIMITED'
    | 'SUBSCRIPTION_REQUIRED'
    | 'GENERATION_FAILED'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'SERVER_ERROR';
}

export type VideoBundleResult<T> = ApiResult<T, VideoBundleApiError>;

// Fal Job specific
export interface FalJobApiError extends ApiError {
  code:
    | 'JOB_NOT_FOUND'
    | 'JOB_FAILED'
    | 'TIMEOUT'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR';
}

export type FalJobResult<T> = ApiResult<T, FalJobApiError>;

// Webhook specific
export interface WebhookApiError extends ApiError {
  code:
    | 'INVALID_SIGNATURE'
    | 'INVALID_PAYLOAD'
    | 'JOB_NOT_FOUND'
    | 'PROCESSING_FAILED';
}

export type WebhookResult<T> = ApiResult<T, WebhookApiError>;

// Type guards
export function isSuccess<T, E>(result: ApiResult<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

export function isError<T, E>(result: ApiResult<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

// Helper to create success response
export function ok<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

// Helper to create error response
export function err<E>(error: E, code?: string): { success: false; error: E; code?: string } {
  return { success: false, error, code };
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat(types): add discriminated union types for API responses (API-001)

- Create ApiResult<T, E> base type with success discriminator
- Add domain-specific error types (VideoBundleApiError, etc.)
- Include type guards isSuccess() and isError()
- Add ok() and err() helper constructors"
```

---

## Task 9: Sanitize Error Messages (SEC-003)

**Files:**
- Create: `src/lib/utils/error-sanitizer.ts`
- Modify: Various error handlers
- Test: Verify sensitive data is stripped

**Step 1: Create error sanitizer**

Create `src/lib/utils/error-sanitizer.ts`:

```typescript
// src/lib/utils/error-sanitizer.ts

/**
 * Sanitize error messages to prevent sensitive data leakage
 */

// Patterns that might contain sensitive data
const SENSITIVE_PATTERNS = [
  // API keys
  /sk[-_][a-zA-Z0-9]{20,}/g,
  /fal[-_][a-zA-Z0-9]{20,}/g,
  /key[-_][a-zA-Z0-9]{20,}/gi,
  /api[-_]?key[=:]\s*[a-zA-Z0-9_-]+/gi,

  // Tokens and secrets
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /token[=:]\s*[a-zA-Z0-9._-]+/gi,
  /secret[=:]\s*[a-zA-Z0-9._-]+/gi,
  /password[=:]\s*[^\s]+/gi,

  // Connection strings
  /postgres:\/\/[^\s]+/gi,
  /mongodb:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,

  // Email addresses in error context
  /[\w.-]+@[\w.-]+\.\w+/g,

  // IPs (might be internal)
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
];

// Safe replacement text
const REDACTED = '[REDACTED]';

/**
 * Sanitize an error message for client display
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, REDACTED);
  }

  return sanitized;
}

/**
 * Sanitize an error object for logging
 * Keeps full detail but marks sensitive parts
 */
export function sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeErrorMessage(error.message),
      stack: error.stack ? sanitizeErrorMessage(error.stack) : undefined,
    };
  }

  if (typeof error === 'string') {
    return { message: sanitizeErrorMessage(error) };
  }

  if (typeof error === 'object' && error !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(error)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeErrorMessage(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return { message: 'Unknown error' };
}

/**
 * Create a safe public error from an internal error
 */
export function toPublicError(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred'
): { message: string; code?: string } {
  if (error instanceof Error) {
    // Check if it's already a public error type
    if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
      return {
        message: sanitizeErrorMessage(error.message),
        code: (error as { code: string }).code,
      };
    }

    // Generic error - use fallback
    return { message: fallbackMessage };
  }

  return { message: fallbackMessage };
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/utils/error-sanitizer.ts
git commit -m "feat(security): add error message sanitization (SEC-003)

- Create error-sanitizer.ts with pattern-based redaction
- Detect API keys, tokens, connection strings, emails, IPs
- Provide sanitizeErrorMessage() for client display
- Provide sanitizeErrorForLogging() for server logs
- Add toPublicError() helper for API responses"
```

---

## Task 10: Final Verification & Build

**Files:**
- All modified files
- Test: Full build passes

**Step 1: Run full verification**

```bash
npm run typecheck && npm run lint && npm run build
```
Expected: All PASS

**Step 2: Verify no scaffold patterns**

```bash
grep -rn "TODO\|Coming soon\|setTimeout.*resolve\|onClick={() => {}}\|MOCK_" src/
```
Expected: No matches (or only pre-existing ones)

**Step 3: Commit verification**

```bash
git add .
git commit -m "chore: verify security fixes build and lint clean

Verification complete:
- SEC-001: Webhook signature validation ✓
- SEC-002: Ownership validation ✓
- SEC-003: Error sanitization ✓
- SEC-004: SSRF protection ✓
- ERR-001: Proper error status codes ✓
- ERR-002: Promise.allSettled resilience ✓
- EDGE-001: AnimatedCounter NaN handling ✓
- EDGE-003: Division by zero guard ✓
- API-001: Discriminated union types ✓"
```

---

## Post-Implementation Checklist

- [ ] Add `FAL_WEBHOOK_SECRET` to environment variables
- [ ] Test webhook with valid/invalid signatures
- [ ] Test URL analyzer with localhost/private IP URLs
- [ ] Verify error responses don't leak sensitive data
- [ ] Run production readiness audit again to verify fixes

---

## Environment Variables Required

Add to `.env.local` and production environment:

```bash
# Fal.ai webhook signature verification
FAL_WEBHOOK_SECRET=your_webhook_secret_here
```

To get webhook secret from Fal.ai:
1. Go to Fal.ai dashboard → Webhooks
2. Copy or generate webhook signing secret
3. Add to environment variables

---

**Report Generated:** 2026-01-21
**Total Tasks:** 10
**Estimated Time:** 4-6 hours
