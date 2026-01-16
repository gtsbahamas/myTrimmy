/**
 * API Key utilities for myTrimmy
 *
 * Key format: mt_live_<32 random chars> (40 chars total)
 * Storage: Only SHA-256 hash is stored, never the raw key
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const KEY_PREFIX = 'mt_live_';
const KEY_RANDOM_LENGTH = 32;
const KEY_TOTAL_LENGTH = KEY_PREFIX.length + KEY_RANDOM_LENGTH; // 40

/**
 * Generate a new API key
 * @returns Object with full key (show once), hash (store), prefix, and suffix (for display)
 */
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
  suffix: string;
} {
  // Generate 24 random bytes, encode as base64url, take first 32 chars
  const random = randomBytes(24).toString('base64url').slice(0, KEY_RANDOM_LENGTH);
  const key = `${KEY_PREFIX}${random}`;
  const hash = hashApiKey(key);

  return {
    key, // Full key - show to user once, then never again
    hash, // SHA-256 hash - store in database
    prefix: KEY_PREFIX, // For display: "mt_live_"
    suffix: key.slice(-4), // For identification: "...x7Kf"
  };
}

/**
 * Hash an API key using SHA-256
 * @param key The raw API key
 * @returns Hex-encoded SHA-256 hash
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 * @param key The key to validate
 * @returns true if key has valid format
 */
export function isValidKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (!key.startsWith(KEY_PREFIX)) return false;
  if (key.length !== KEY_TOTAL_LENGTH) return false;

  // Check that the random part only contains base64url characters
  const randomPart = key.slice(KEY_PREFIX.length);
  return /^[A-Za-z0-9_-]+$/.test(randomPart);
}

/**
 * Compare two hashes in constant time to prevent timing attacks
 * @param hash1 First hash
 * @param hash2 Second hash
 * @returns true if hashes match
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  if (hash1.length !== hash2.length) return false;

  try {
    const buf1 = Buffer.from(hash1, 'hex');
    const buf2 = Buffer.from(hash2, 'hex');
    return timingSafeEqual(buf1, buf2);
  } catch {
    return false;
  }
}

/**
 * Format a key for display (hide middle, show prefix and suffix)
 * @param prefix Key prefix (e.g., "mt_live_")
 * @param suffix Key suffix (e.g., "x7Kf")
 * @returns Display string (e.g., "mt_live_...x7Kf")
 */
export function formatKeyForDisplay(prefix: string, suffix: string): string {
  return `${prefix}...${suffix}`;
}

/**
 * Extract the API key from an Authorization header
 * @param authHeader The Authorization header value
 * @returns The API key or null if not a valid Bearer token with mt_live_ prefix
 */
export function extractApiKeyFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7); // Remove "Bearer "
  if (!token.startsWith(KEY_PREFIX)) return null;

  return token;
}
