import Stripe from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured.' }, { status: 503, headers: CORS });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return Response.json({ error: 'Missing or invalid session_id.' }, { status: 400, headers: CORS });
  }

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json(
        { verified: false, reason: 'Payment not completed.' },
        { status: 402, headers: CORS }
      );
    }

    const tier = (session.metadata?.tier as 'plus' | 'pro') || 'plus';

    return Response.json(
      {
        verified: true,
        tier,
        customerId: session.customer as string,
        subscriptionId: session.subscription as string,
        userId: session.metadata?.userId || null,
      },
      { headers: CORS }
    );
  } catch (err: any) {
    console.error('[verify-checkout] error:', err?.message);
    return Response.json(
      { error: err?.message || 'Verification failed.' },
      { status: 500, headers: CORS }
    );
  }
};
