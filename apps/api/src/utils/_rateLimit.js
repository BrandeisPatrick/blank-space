/**
 * Simple rate limiting for burst protection
 * Uses in-memory store (resets on serverless cold start)
 */

// In-memory store for rate limiting
const rateLimitStore = new Map();

// Rate limit configuration (generous for beta)
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 30, // 30 requests per minute per IP
};

/**
 * Clean up old entries from the store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.startTime > RATE_LIMIT.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 */
function getClientId(req) {
  // Try to get real IP from various headers
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Check rate limit for a request
 * @param {object} req - Request object
 * @returns {object} Rate limit status
 */
export function checkRateLimit(req) {
  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    cleanupStore();
  }

  const clientId = getClientId(req);
  const now = Date.now();

  // Get or create rate limit data for this client
  let data = rateLimitStore.get(clientId);

  if (!data || now - data.startTime > RATE_LIMIT.windowMs) {
    // Start new window
    data = {
      startTime: now,
      count: 0,
    };
    rateLimitStore.set(clientId, data);
  }

  // Increment count
  data.count++;

  const remaining = Math.max(0, RATE_LIMIT.maxRequests - data.count);
  const resetTime = new Date(data.startTime + RATE_LIMIT.windowMs).toISOString();

  return {
    allowed: data.count <= RATE_LIMIT.maxRequests,
    limit: RATE_LIMIT.maxRequests,
    remaining,
    reset: resetTime,
    used: data.count,
  };
}
