/**
 * User Usage Endpoint (Beta)
 * GET /api/user/usage - Returns current usage and limits
 */

import { verifyAuth, getFirestore } from '../middleware/_auth.js';

const LIMITS = {
  daily: 300,
  monthly: 500,
};

/**
 * Get next reset time for daily quota (2 AM EST = 7 AM UTC)
 */
function getNextDailyReset() {
  const now = new Date();
  const resetHourUTC = 7; // 2 AM EST

  let resetDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    resetHourUTC, 0, 0, 0
  ));

  if (now >= resetDate) {
    resetDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      resetHourUTC, 0, 0, 0
    ));
  }

  return resetDate.toISOString();
}

/**
 * Get next reset time for monthly quota (1st of next month 2 AM EST)
 */
function getNextMonthlyReset() {
  const now = new Date();
  const resetHourUTC = 7; // 2 AM EST

  const nextMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1, resetHourUTC, 0, 0, 0
  ));

  return nextMonth.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // Default usage
    let usage = {
      dailyUsed: 0,
      dailyResetAt: getNextDailyReset(),
      monthlyUsed: 0,
      monthlyResetAt: getNextMonthlyReset(),
    };

    if (userDoc.exists && userDoc.data().usage) {
      usage = { ...usage, ...userDoc.data().usage };

      // Check if resets are needed
      const now = new Date();
      let needsUpdate = false;

      if (new Date(usage.dailyResetAt) <= now) {
        usage.dailyUsed = 0;
        usage.dailyResetAt = getNextDailyReset();
        needsUpdate = true;
      }

      if (new Date(usage.monthlyResetAt) <= now) {
        usage.monthlyUsed = 0;
        usage.monthlyResetAt = getNextMonthlyReset();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await userRef.set({ usage }, { merge: true });
      }
    }

    // Ensure values are valid numbers (handle null/undefined/NaN from Firestore)
    const dailyUsed = (typeof usage.dailyUsed === 'number' && !isNaN(usage.dailyUsed)) ? usage.dailyUsed : 0;
    const monthlyUsed = (typeof usage.monthlyUsed === 'number' && !isNaN(usage.monthlyUsed)) ? usage.monthlyUsed : 0;

    return res.status(200).json({
      success: true,
      usage: {
        daily: {
          used: dailyUsed,
          limit: LIMITS.daily,
          remaining: Math.max(0, LIMITS.daily - dailyUsed),
          resetAt: usage.dailyResetAt,
        },
        monthly: {
          used: monthlyUsed,
          limit: LIMITS.monthly,
          remaining: Math.max(0, LIMITS.monthly - monthlyUsed),
          resetAt: usage.monthlyResetAt,
        },
      },
      limits: LIMITS,
      note: 'Pro model costs 3 credits per request',
    });
  } catch (error) {
    console.error('Usage endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
