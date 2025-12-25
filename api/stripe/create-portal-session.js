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

    // Get return URL - use custom domain for production
    const vercelUrl = process.env.VERCEL_URL;
    const isProduction = process.env.VERCEL_ENV === 'production';
    const isLocalhost = vercelUrl?.includes('localhost');

    let baseUrl;
    if (isLocalhost) {
      baseUrl = `http://${vercelUrl}`;
    } else if (isProduction) {
      baseUrl = 'https://www.blankspace.build';
    } else if (vercelUrl) {
      baseUrl = `https://${vercelUrl}`;
    } else {
      baseUrl = 'http://localhost:3000';
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: baseUrl,
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
