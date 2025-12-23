/**
 * Stripe Webhook Handler
 *
 * POST /api/stripe/webhook
 * Handles Stripe subscription events
 */

import Stripe from 'stripe';
import { getFirestore } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Get raw body from request
 */
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Get tier from price ID
 */
function getTierFromPriceId(priceId) {
  const litePriceId = process.env.STRIPE_PRICE_LITE_MONTHLY;
  const proPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY;

  if (priceId === proPriceId) return 'pro';
  if (priceId === litePriceId) return 'lite';

  // Fallback: check if price name contains tier
  return 'lite';
}

/**
 * Handle checkout.session.completed
 * User has completed payment
 */
async function handleCheckoutComplete(session) {
  const firebaseUserId = session.metadata?.firebaseUserId;
  if (!firebaseUserId) {
    console.error('No firebaseUserId in session metadata');
    return;
  }

  const subscriptionId = session.subscription;
  const customerId = session.customer;

  // Fetch subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = getTierFromPriceId(priceId);

  // Update Firestore
  const db = getFirestore();
  await db.collection('users').doc(firebaseUserId).update({
    'subscription.tier': tier,
    'subscription.status': 'active',
    'subscription.stripeCustomerId': customerId,
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.stripePriceId': priceId,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
  });

  console.log(`Subscription activated for user ${firebaseUserId}: ${tier}`);
}

/**
 * Handle customer.subscription.updated
 * Plan changed, renewed, or modified
 */
async function handleSubscriptionUpdate(subscription) {
  const firebaseUserId = subscription.metadata?.firebaseUserId;
  if (!firebaseUserId) {
    // Try to find user by customer ID
    const customerId = subscription.customer;
    const db = getFirestore();
    const usersSnapshot = await db.collection('users')
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('No user found for subscription update');
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    await updateUserSubscription(userId, subscription);
    return;
  }

  await updateUserSubscription(firebaseUserId, subscription);
}

/**
 * Update user subscription in Firestore
 */
async function updateUserSubscription(userId, subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  const tier = getTierFromPriceId(priceId);

  const db = getFirestore();
  await db.collection('users').doc(userId).update({
    'subscription.tier': tier,
    'subscription.status': subscription.status,
    'subscription.stripePriceId': priceId,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000).toISOString(),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
  });

  console.log(`Subscription updated for user ${userId}: ${tier} (${subscription.status})`);
}

/**
 * Handle customer.subscription.deleted
 * Subscription canceled or expired
 */
async function handleSubscriptionDeleted(subscription) {
  const firebaseUserId = subscription.metadata?.firebaseUserId;
  let userId = firebaseUserId;

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer;
    const db = getFirestore();
    const usersSnapshot = await db.collection('users')
      .where('subscription.stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error('No user found for subscription deletion');
      return;
    }

    userId = usersSnapshot.docs[0].id;
  }

  // Downgrade to free tier
  const db = getFirestore();
  await db.collection('users').doc(userId).update({
    'subscription.tier': 'free',
    'subscription.status': 'canceled',
    'subscription.stripeSubscriptionId': null,
    'subscription.stripePriceId': null,
    'subscription.currentPeriodEnd': null,
    'subscription.cancelAtPeriodEnd': false,
  });

  console.log(`Subscription deleted for user ${userId}, downgraded to free`);
}

/**
 * Handle invoice.payment_failed
 * Payment failed (card declined, etc.)
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const db = getFirestore();
  const usersSnapshot = await db.collection('users')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.error('No user found for payment failed');
    return;
  }

  const userId = usersSnapshot.docs[0].id;
  await db.collection('users').doc(userId).update({
    'subscription.status': 'past_due',
  });

  console.log(`Payment failed for user ${userId}, marked as past_due`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      error: 'Webhook signature verification failed',
      message: err.message,
    });
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return res.status(500).json({
      error: 'Webhook handler failed',
      message: error.message,
    });
  }
}
