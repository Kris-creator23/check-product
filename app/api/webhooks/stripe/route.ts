import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/stripe";
import { createServiceRoleClient } from "../../../../lib/supabase-admin";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = getStripe().webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    const supabase = createServiceRoleClient();

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.warn("Subscription event missing user_id in metadata", subscription.id);
          break;
        }

        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            ...(subscription.status === "trialing" && subscription.trial_start
              ? { trial_started_at: new Date(subscription.trial_start * 1000).toISOString() }
              : {}),
            ...(subscription.status === "trialing" && subscription.trial_end
              ? { trial_ends_at: new Date(subscription.trial_end * 1000).toISOString() }
              : {})
          })
          .eq("user_id", userId);

        console.log(`Updated subscription for user ${userId}: status=${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.user_id;

        if (!userId) {
          console.warn("Subscription delete event missing user_id", subscription.id);
          break;
        }

        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled"
          })
          .eq("user_id", userId);

        console.log(`Canceled subscription for user ${userId}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const userId = invoice.subscription_metadata?.user_id;

        if (userId && invoice.subscription) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              current_period_end: new Date(invoice.period_end * 1000).toISOString()
            })
            .eq("user_id", userId);

          console.log(`Payment succeeded for user ${userId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const userId = invoice.subscription_metadata?.user_id;

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "past_due"
            })
            .eq("user_id", userId);

          console.log(`Payment failed for user ${userId}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
