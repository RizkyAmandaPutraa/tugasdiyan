/**
 * Validates and sanitizes user-provided URLs to prevent SSRF attacks.
 * Blocks requests to private/internal IP ranges and non-HTTP(S) schemes.
 */

const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  /^127\./,                          // Loopback
  /^10\./,                           // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./,     // Class B private
  /^192\.168\./,                     // Class C private
  /^169\.254\./,                     // Link-local
  /^0\./,                            // Current network
  // IPv6
  /^::1$/,                           // Loopback
  /^fe80:/i,                         // Link-local
  /^fc00:/i,                         // Unique local
  /^fd/i,                            // Unique local
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",                 // AWS/GCP metadata
  "100.100.100.200",                 // Alibaba Cloud metadata
  "[::1]",
];

export type UrlValidationResult =
  | { valid: true; url: string }
  | { valid: false; error: string };

export function validateTargetUrl(input: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Only allow http and https schemes
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
  }

  // Block URLs with credentials
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URLs with embedded credentials are not allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.some((blocked) => hostname === blocked)) {
    return { valid: false, error: "Requests to internal/private addresses are not allowed" };
  }

  // Block private IP ranges
  if (PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostname))) {
    return { valid: false, error: "Requests to internal/private addresses are not allowed" };
  }

  // Block if hostname is an IPv6 address in brackets that resolves to private
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    const ipv6 = hostname.slice(1, -1);
    if (PRIVATE_IP_RANGES.some((pattern) => pattern.test(ipv6))) {
      return { valid: false, error: "Requests to internal/private addresses are not allowed" };
    }
  }

  return { valid: true, url: parsed.toString() };
}
