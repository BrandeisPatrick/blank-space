/**
 * Rate Limiting Utility
 * Tracks daily request limits per IP address
 */

// In-memory storage for rate limiting
const requestCounts = new Map();

// Configuration
const DAILY_LIMIT = 50;
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Get client identifier (IP address)
 */
function getClientKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         'unknown';
}

/**
 * Get current day key (YYYY-MM-DD in UTC)
 */
function getCurrentDayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get midnight UTC timestamp for rate limit reset
 */
function getNextMidnightUTC() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.toISOString();
}

/**
 * Check and update rate limit for a client
 * Returns: { allowed: boolean, remaining: number, limit: number, reset: string, used: number }
 */
export function checkRateLimit(req) {
  const clientKey = getClientKey(req);
  const dayKey = getCurrentDayKey();
  const storageKey = `${clientKey}:${dayKey}`;

  // Get current count for this client today
  const currentCount = requestCounts.get(storageKey) || 0;

  // Check if limit exceeded
  if (currentCount >= DAILY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      limit: DAILY_LIMIT,
      reset: getNextMidnightUTC(),
      used: currentCount
    };
  }

  // Increment count
  const newCount = currentCount + 1;
  requestCounts.set(storageKey, newCount);

  return {
    allowed: true,
    remaining: DAILY_LIMIT - newCount,
    limit: DAILY_LIMIT,
    reset: getNextMidnightUTC(),
    used: newCount
  };
}

/**
 * Cleanup old entries (run periodically)
 */
function cleanupOldEntries() {
  const currentDay = getCurrentDayKey();

  for (const [key] of requestCounts) {
    // Extract day from key (format: "ip:YYYY-MM-DD")
    const keyDay = key.split(':').slice(-1)[0];

    if (keyDay !== currentDay) {
      requestCounts.delete(key);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, CLEANUP_INTERVAL);
}
