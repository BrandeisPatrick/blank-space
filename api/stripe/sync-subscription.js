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
  console.log('[sync-subscription] Request received');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    console.log('[sync-subscription] Stripe not configured');
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      console.log('[sync-subscription] Auth error:', authResult.error);
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId, email: authEmail } = authResult;
    console.log('[sync-subscription] User ID:', userId, 'Auth email:', authEmail);

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log('[sync-subscription] User doc does not exist');
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log('[sync-subscription] User data email:', userData?.email);

    const stripeCustomerId = userData?.subscription?.stripeCustomerId;
    console.log('[sync-subscription] Existing customer ID:', stripeCustomerId);

    // Use auth email as fallback
    const userEmail = userData?.email || authEmail;

    if (!stripeCustomerId) {
      // No customer yet - check recent checkout sessions for this user
      console.log('[sync-subscription] No customer ID, checking recent checkout sessions...');

      // First try to find recent completed checkout sessions
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
        status: 'complete',
      });

      // Find session with our Firebase user ID
      const userSession = sessions.data.find(
        s => s.metadata?.firebaseUserId === userId
      );

      if (userSession && userSession.customer) {
        console.log('[sync-subscription] Found checkout session for user:', userSession.id);
        const customerId = userSession.customer;

        // Get subscription from this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const priceId = subscription.items.data[0]?.price?.id;
          const tier = getTierFromPriceId(priceId);

          console.log('[sync-subscription] Found subscription via session:', { id: subscription.id, tier });

          // Update Firestore
          await userRef.update({
            'subscription.tier': tier,
            'subscription.status': subscription.status,
            'subscription.stripeCustomerId': customerId,
            'subscription.stripeSubscriptionId': subscription.id,
            'subscription.stripePriceId': priceId,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
            'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
          });

          console.log('[sync-subscription] Firestore updated successfully');

          return res.status(200).json({
            synced: true,
            tier,
            status: subscription.status,
          });
        }
      }

      // Fallback: try to find customer by email
      if (!userEmail) {
        console.log('[sync-subscription] No email found');
        return res.status(200).json({
          synced: false,
          tier: 'free',
          message: 'No subscription found',
        });
      }

      console.log('[sync-subscription] Fallback: searching by email:', userEmail);
      const customers = await stripe.customers.list({
        limit: 5,
        email: userEmail,
      });

      console.log('[sync-subscription] Found customers by email:', customers.data.length);

      if (customers.data.length === 0) {
        console.log('[sync-subscription] No customer found');
        return res.status(200).json({
          synced: false,
          tier: 'free',
          message: 'No subscription found',
        });
      }

      // Use the found customer
      const customer = customers.data[0];
      console.log('[sync-subscription] Found customer:', customer.id);

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1,
      });

      console.log('[sync-subscription] Found subscriptions:', subscriptions.data.length);

      if (subscriptions.data.length === 0) {
        console.log('[sync-subscription] No active subscription');
        return res.status(200).json({
          synced: false,
          tier: 'free',
          message: 'No active subscription',
        });
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price?.id;
      const tier = getTierFromPriceId(priceId);

      console.log('[sync-subscription] Subscription found:', { id: subscription.id, priceId, tier });

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

      console.log('[sync-subscription] Firestore updated successfully');

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
    console.error('[sync-subscription] Error:', error.message);
    console.error('[sync-subscription] Stack:', error.stack);
    return res.status(500).json({
      error: 'Failed to sync subscription',
      message: error.message,
      type: error.type || error.code || 'unknown',
    });
  }
}
