import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminSupabase } from "../../../../lib/supabase";
import { getStripe } from "../../../../lib/stripe";
import { subscriptionPeriodEnd } from "../../../../lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    return NextResponse.json({
      error: `Webhook signature failed: ${error}`,
      debug: {
        bodyLength: body.length,
        hasSignature: Boolean(signature),
        secretPrefix: secret.slice(0, 6),
        secretLength: secret.length
      }
    }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (session.mode === "setup" && userId && session.setup_intent) {
      const setupIntentId = typeof session.setup_intent === "string"
        ? session.setup_intent
        : session.setup_intent.id;
      const setupIntent = await getStripe().setupIntents.retrieve(setupIntentId);
      if (setupIntent.status === "succeeded") {
        const paymentMethodId = typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id ?? null;
        const { error } = await supabase.from("profiles").upsert({
          user_id: userId,
          stripe_customer_id: String(session.customer),
          payment_method_ready: true,
          stripe_payment_method_id: paymentMethodId,
          payment_method_added_at: new Date().toISOString()
        }, { onConflict: "user_id" });
        if (error) console.error("Failed to store setup payment method", error);
      }
    }

    if (session.mode === "subscription" && userId && session.subscription) {
      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId) as Stripe.Subscription & {
        current_period_end?: number;
        trial_end?: number | null;
      };
      const periodEnd = subscriptionPeriodEnd(subscription as any);
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId,
        selected_plan: plan,
        stripe_customer_id: String(session.customer),
        stripe_subscription_id: subscriptionId,
        subscription_status: subscription.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        ...(subscription.trial_end ? { trial_started_at: new Date().toISOString() } : {})
      }, { onConflict: "user_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (event.type === "payment_method.detached") {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    const customerId = typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id;
    if (customerId) {
      const cards = await getStripe().paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
      if (cards.data.length === 0) {
        const { error } = await supabase.from("profiles").update({
          payment_method_ready: false,
          stripe_payment_method_id: null
        }).eq("stripe_customer_id", customerId);
        if (error) console.error("Failed to clear detached payment method", error);
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number; trial_end?: number | null };
    const userId = subscription.metadata.user_id;
    const plan = subscription.metadata.plan;

    if (userId) {
      const periodEnd = subscriptionPeriodEnd(subscription as any);
      const patch: Record<string, unknown> = {
        user_id: userId,
        selected_plan: plan,
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null
      };
      if (subscription.trial_end) {
        patch.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
      }
      const { error } = await supabase.from("profiles").upsert({
        ...patch
      }, { onConflict: "user_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
