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
  '100.100.100.200',            // Alibaba Cloud metadata
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

  // Block IPv6 addresses entirely (prevents ::1, ::ffff:127.0.0.1, etc.)
  if (hostname.includes('[') || hostname.includes(':')) {
    return { valid: false, error: 'IPv6 addresses not allowed' };
  }

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

  // Check for numeric IP in hostname (e.g., 2130706433 = 127.0.0.1)
  if (/^\d+$/.test(hostname)) {
    return { valid: false, error: 'Numeric IP addresses not allowed' };
  }

  // Check for hex/octal IP encoding tricks (at start only)
  if (/^0x[0-9a-f]/i.test(hostname) || /^0\d+\./.test(hostname)) {
    return { valid: false, error: 'Encoded IP addresses not allowed' };
  }

  return {
    valid: true,
    sanitizedUrl: parsed.href,
  };
}
