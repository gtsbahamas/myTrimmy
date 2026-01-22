// src/lib/services/webhook-security.ts

import crypto from 'crypto';

const FAL_WEBHOOK_SECRET = process.env.FAL_WEBHOOK_SECRET;

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate Fal.ai webhook using shared secret in URL
 * The secret is passed as a query parameter when registering the webhook
 *
 * This approach is secure because:
 * - HTTPS encrypts the URL including query params
 * - Only Fal.ai knows the webhook URL you provided
 * - An attacker would need to know your secret
 *
 * Note: The previous implementation using HMAC-SHA256 was incorrect.
 * Fal.ai uses ED25519 public-key cryptography with 4 headers, not HMAC.
 * A shared secret approach is simpler and officially recommended by Fal.
 */
export function validateFalWebhookSecret(
  providedSecret: string | null
): WebhookValidationResult {
  // In development, skip validation if no secret configured
  if (!FAL_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[webhook-security] No FAL_WEBHOOK_SECRET configured, skipping validation in dev');
      return { valid: true };
    }
    return { valid: false, error: 'Webhook secret not configured' };
  }

  if (!providedSecret) {
    return { valid: false, error: 'Missing secret parameter' };
  }

  // Constant-time comparison to prevent timing attacks
  if (providedSecret.length !== FAL_WEBHOOK_SECRET.length) {
    return { valid: false, error: 'Invalid secret' };
  }

  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(FAL_WEBHOOK_SECRET);

  // Use try-catch in case buffers are different lengths (shouldn't happen after length check)
  try {
    const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    if (!isValid) {
      return { valid: false, error: 'Invalid secret' };
    }
  } catch {
    return { valid: false, error: 'Invalid secret' };
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
