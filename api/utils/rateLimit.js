/**
 * Rate Limiting Utility
 * Uses Vercel KV (Redis) for persistent rate limiting across serverless instances
 */

import { kv } from '@vercel/kv';

// Configuration - Per User
const DAILY_LIMIT = 50;

// Configuration - Global (shared across all users) - Set to stay in free tier
const GLOBAL_DAILY_LIMIT = 500;

// Configuration - Per Service limits
const SERVICE_LIMITS = {
  openai: { perUser: 50, global: 500 },
  gemini: { perUser: 50, global: 500 }
};

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
 * Get seconds until midnight UTC (for Redis TTL)
 */
function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return Math.ceil((midnight - now) / 1000);
}

/**
 * Check and update rate limit for a client
 * @param {object} req - Request object
 * @param {string} service - Service name ('openai' or 'gemini')
 * Returns: { allowed: boolean, remaining: number, limit: number, reset: string, used: number, global: object }
 */
export async function checkRateLimit(req, service = 'openai') {
  const clientKey = getClientKey(req);
  const dayKey = getCurrentDayKey();
  const userKey = `ratelimit:${service}:user:${clientKey}:${dayKey}`;
  const globalKey = `ratelimit:${service}:global:${dayKey}`;

  // Get service-specific limits or defaults
  const limits = SERVICE_LIMITS[service] || { perUser: DAILY_LIMIT, global: GLOBAL_DAILY_LIMIT };
  const ttl = getSecondsUntilMidnight();

  try {
    // Get current counts from Redis
    const [currentCount, globalCount] = await Promise.all([
      kv.get(userKey) || 0,
      kv.get(globalKey) || 0
    ]);

    const userCount = currentCount || 0;
    const totalCount = globalCount || 0;

    // Check global limit first
    if (totalCount >= limits.global) {
      return {
        allowed: false,
        remaining: 0,
        limit: limits.perUser,
        reset: getNextMidnightUTC(),
        used: userCount,
        global: {
          remaining: 0,
          limit: limits.global,
          used: totalCount,
          exceeded: true
        },
        reason: 'global_limit_exceeded'
      };
    }

    // Check per-user limit
    if (userCount >= limits.perUser) {
      return {
        allowed: false,
        remaining: 0,
        limit: limits.perUser,
        reset: getNextMidnightUTC(),
        used: userCount,
        global: {
          remaining: limits.global - totalCount,
          limit: limits.global,
          used: totalCount,
          exceeded: false
        },
        reason: 'user_limit_exceeded'
      };
    }

    // Increment both counts atomically with TTL (auto-expire at midnight)
    await Promise.all([
      kv.incr(userKey).then(() => kv.expire(userKey, ttl)),
      kv.incr(globalKey).then(() => kv.expire(globalKey, ttl))
    ]);

    const newUserCount = userCount + 1;
    const newGlobalCount = totalCount + 1;

    return {
      allowed: true,
      remaining: limits.perUser - newUserCount,
      limit: limits.perUser,
      reset: getNextMidnightUTC(),
      used: newUserCount,
      global: {
        remaining: limits.global - newGlobalCount,
        limit: limits.global,
        used: newGlobalCount,
        exceeded: false
      }
    };

  } catch (error) {
    // If Redis fails, allow request but log error (fail open)
    console.error('Rate limit Redis error:', error);
    return {
      allowed: true,
      remaining: limits.perUser,
      limit: limits.perUser,
      reset: getNextMidnightUTC(),
      used: 0,
      global: {
        remaining: limits.global,
        limit: limits.global,
        used: 0,
        exceeded: false
      },
      error: 'Redis unavailable, allowing request'
    };
  }
}
