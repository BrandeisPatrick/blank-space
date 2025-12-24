/**
 * Create Stripe Checkout Session
 *
 * POST /api/stripe/create-checkout-session
 * Body: { priceId: 'price_xxx' }
 * Returns: { url: 'https://checkout.stripe.com/...' }
 */

import Stripe from 'stripe';
import { verifyAuth, getFirestore } from '../middleware/_auth.js';

// Initialize Stripe only if key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(503).json({
      error: 'Stripe not configured',
      message: 'Payment processing is not available. Please configure STRIPE_SECRET_KEY.',
    });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId, email } = authResult;
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing priceId',
      });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    let stripeCustomerId = userDoc.data()?.subscription?.stripeCustomerId;

    // Create Stripe customer if not exists
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          firebaseUserId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to Firestore
      await userRef.update({
        'subscription.stripeCustomerId': stripeCustomerId,
      });
    }

    // Get success and cancel URLs
    // Use http for localhost, https for deployed environments
    const vercelUrl = process.env.VERCEL_URL;
    const isLocalhost = vercelUrl?.includes('localhost');
    const baseUrl = isLocalhost
      ? `http://${vercelUrl}`
      : (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/settings?tab=billing&success=true`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        firebaseUserId: userId,
      },
      subscription_data: {
        metadata: {
          firebaseUserId: userId,
        },
      },
      allow_promotion_codes: true,
    });

    return res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
