/**
 * Sync Subscription Status
 *
 * POST /api/stripe/sync-subscription
 * Fetches subscription directly from Stripe and updates Firestore
 * Called after checkout success to ensure immediate update
 */

import Stripe from 'stripe';
import { verifyAuth, getFirestore } from '../middleware/_auth.js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Get tier from price ID
 */
function getTierFromPriceId(priceId) {
  const litePriceId = process.env.STRIPE_PRICE_LITE_MONTHLY;
  const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (priceId === proPriceId) return 'pro';
  if (priceId === litePriceId) return 'lite';
  return 'lite'; // fallback
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
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
    const userData = userDoc.data();

    const stripeCustomerId = userData?.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      // No customer yet - check if they just completed checkout
      // Try to find customer by metadata
      const customers = await stripe.customers.list({
        limit: 1,
        email: userData.email,
      });

      if (customers.data.length === 0) {
        return res.status(200).json({
          synced: false,
          tier: 'free',
          message: 'No subscription found',
        });
      }

      // Use the found customer
      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return res.status(200).json({
          synced: false,
          tier: 'free',
          message: 'No active subscription',
        });
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price?.id;
      const tier = getTierFromPriceId(priceId);

      // Update Firestore
      await userRef.update({
        'subscription.tier': tier,
        'subscription.status': subscription.status,
        'subscription.stripeCustomerId': customer.id,
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.stripePriceId': priceId,
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      });

      return res.status(200).json({
        synced: true,
        tier,
        status: subscription.status,
      });
    }

    // Customer exists - fetch their subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No subscription - set to free
      await userRef.update({
        'subscription.tier': 'free',
        'subscription.status': 'none',
        'subscription.stripeSubscriptionId': null,
        'subscription.stripePriceId': null,
        'subscription.currentPeriodEnd': null,
        'subscription.cancelAtPeriodEnd': false,
      });

      return res.status(200).json({
        synced: true,
        tier: 'free',
        status: 'none',
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;

    // Determine tier based on subscription status
    let tier = 'free';
    if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
      tier = getTierFromPriceId(priceId);
    }

    // Update Firestore with current Stripe state
    await userRef.update({
      'subscription.tier': tier,
      'subscription.status': subscription.status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.stripePriceId': priceId,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    });

    return res.status(200).json({
      synced: true,
      tier,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

  } catch (error) {
    console.error('Sync subscription error:', error);
    return res.status(500).json({
      error: 'Failed to sync subscription',
      message: error.message,
    });
  }
}
