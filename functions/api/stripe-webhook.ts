import Stripe from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] Missing Stripe env vars');
    return new Response('Server misconfiguration', { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    event = await stripe.webhooks.constructEventAsync(body, sig!, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] Event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tier = session.metadata?.tier;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      console.log(`[stripe-webhook] Checkout complete: userId=${userId} tier=${tier} customer=${customerId} sub=${subscriptionId}`);
      // Firebase Admin SDK update would go here.
      // For now, the client-side verify-checkout endpoint handles tier activation on return.
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status;
      const userId = sub.metadata?.userId;
      console.log(`[stripe-webhook] Subscription updated: userId=${userId} status=${status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      console.log(`[stripe-webhook] Subscription cancelled: userId=${userId}`);
      // Downgrade user to free tier in Firebase here.
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[stripe-webhook] Payment failed for customer: ${invoice.customer}`);
      break;
    }

    default:
      console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
  }

  return new Response('ok', { status: 200 });
};
