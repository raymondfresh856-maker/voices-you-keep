import Stripe from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
}

const PRICE_IDS: Record<string, string> = {
  plus: 'price_1TJ37fGx3dL9Udr2CwGyHt68',
  pro:  'price_1TJ37gGx3dL9Udr2B6XXs2bv',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json(
      { error: 'Stripe is not configured on this server.' },
      { status: 503, headers: CORS }
    );
  }

  try {
    const { tier, userId, userEmail } = await request.json<{
      tier: string;
      userId?: string;
      userEmail?: string;
    }>();

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      return Response.json({ error: 'Invalid plan selected.' }, { status: 400, headers: CORS });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      metadata: {
        tier,
        userId: userId || '',
      },
      subscription_data: {
        metadata: { tier, userId: userId || '' },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return Response.json({ url: session.url }, { headers: CORS });
  } catch (err: any) {
    console.error('[create-checkout] error:', err?.message);
    return Response.json(
      { error: err?.message || 'Failed to create checkout session.' },
      { status: 500, headers: CORS }
    );
  }
};
