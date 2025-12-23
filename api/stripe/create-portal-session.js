/**
 * Create Stripe Customer Portal Session
 *
 * POST /api/stripe/create-portal-session
 * Returns: { url: 'https://billing.stripe.com/...' }
 */

import Stripe from 'stripe';
import { verifyAuth, getFirestore } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Get return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000';

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
