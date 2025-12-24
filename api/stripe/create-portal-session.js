/**
 * Create Stripe Customer Portal Session
 *
 * POST /api/stripe/create-portal-session
 * Returns: { url: 'https://billing.stripe.com/...' }
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

    const { userId } = authResult;
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    const stripeCustomerId = userDoc.data()?.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({
        error: 'No subscription',
        message: 'You do not have an active subscription to manage.',
      });
    }

    // Get return URL (same logic as create-checkout-session)
    const vercelUrl = process.env.VERCEL_URL;
    const isLocalhost = vercelUrl?.includes('localhost');
    const baseUrl = isLocalhost
      ? `http://${vercelUrl}`
      : (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/settings?tab=billing`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
}
