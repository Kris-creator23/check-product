import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminSupabase } from "../../../../lib/supabase";
import { getStripe } from "../../../../lib/stripe";

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

    if (userId) {
      await supabase.from("profiles").upsert({
        user_id: userId,
        selected_plan: plan,
        stripe_customer_id: String(session.customer),
        stripe_subscription_id: String(session.subscription),
        subscription_status: session.metadata?.trial_mode === "none" ? "active" : "trialing",
        ...(session.metadata?.trial_mode === "none" ? {} : { trial_started_at: new Date().toISOString() })
      }, { onConflict: "user_id" });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number; trial_end?: number | null };
    const userId = subscription.metadata.user_id;
    const plan = subscription.metadata.plan;

    if (userId) {
      await supabase.from("profiles").upsert({
        user_id: userId,
        selected_plan: plan,
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
      }, { onConflict: "user_id" });
    }
  }

  return NextResponse.json({ received: true });
}
