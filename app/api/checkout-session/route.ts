import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "../../../lib/auth";
import { getPlan } from "../../../lib/plans";
import { getStripe } from "../../../lib/stripe";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) {
    return NextResponse.json({ error: "Virheellinen Checkout-istunto." }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  if (session.metadata?.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Checkout-istunto ei kuulu tälle käyttäjälle." }, { status: 403 });
  }

  const subscription = session.subscription as Stripe.Subscription & {
    current_period_end?: number;
    trial_end?: number | null;
  };
  const plan = getPlan(session.metadata?.plan);

  return NextResponse.json({
    plan: plan ? { id: plan.id, name: plan.name, price: plan.price } : null,
    status: subscription.status,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    chargedImmediately: session.metadata?.trial_mode === "none"
  });
}
