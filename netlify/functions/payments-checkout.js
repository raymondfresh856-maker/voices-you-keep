const { handleOptions, jsonResponse, authenticateRequest, parseBody, getSupabaseAdmin } = require('./utils/supabase');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Price IDs — set these in Netlify env vars, or use placeholders
const PRICE_MAP = {
  KEEPER: process.env.STRIPE_KEEPER_PRICE_ID || 'STRIPE_KEEPER_MONTHLY_LINK',
  LEGACY: process.env.STRIPE_LEGACY_PRICE_ID || 'STRIPE_LEGACY_MONTHLY_LINK',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const auth = authenticateRequest(event);
  if (auth.error) return auth.error;

  const { tier } = parseBody(event);

  if (!tier || !PRICE_MAP[tier]) {
    return jsonResponse(400, { error: 'Invalid tier. Must be KEEPER or LEGACY.' });
  }

  // If Stripe is not configured, return placeholder URL
  if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'placeholder') {
    return jsonResponse(200, {
      url: `https://checkout.stripe.com/placeholder?tier=${tier}`,
      message: 'Stripe is not yet configured. Set STRIPE_SECRET_KEY in your Netlify environment variables.',
    });
  }

  try {
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    const supabaseAdmin = getSupabaseAdmin();

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email, name')
      .eq('id', auth.user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || auth.user.email,
        name: profile?.name || 'User',
        metadata: { userId: auth.user.id },
      });
      customerId = customer.id;

      await supabaseAdmin.from('profiles').update({
        stripe_customer_id: customerId,
      }).eq('id', auth.user.id);
    }

    // Build checkout session
    const baseUrl = event.headers.origin || 'https://voices-you-keep.netlify.app';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICE_MAP[tier], quantity: 1 }],
      success_url: `${baseUrl}/card-creator.html?upgraded=${tier}`,
      cancel_url: `${baseUrl}/#/pricing`,
      metadata: {
        userId: auth.user.id,
        tier,
      },
    });

    return jsonResponse(200, { url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return jsonResponse(500, { error: 'Failed to create checkout session' });
  }
};
