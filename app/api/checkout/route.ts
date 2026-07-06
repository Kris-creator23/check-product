import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getPlan } from "../../../lib/plans";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const plan = getPlan(body.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const price = process.env[plan.stripeEnv];
  if (!price) return NextResponse.json({ error: `${plan.stripeEnv} is missing.` }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email,
      metadata: { user_id: auth.user.id }
    });
    customerId = customer.id;
  }

  await auth.supabase.from("profiles").upsert({
    user_id: auth.user.id,
    email: auth.user.email,
    selected_plan: plan.id,
    stripe_customer_id: customerId
  }, { onConflict: "user_id" });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cancel`,
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    customer_update: {
      address: "auto",
      name: "auto"
    },
    payment_method_collection: "always",
    tax_id_collection: { enabled: true },
    subscription_data: {
      trial_period_days: 7,
      metadata: {
        user_id: auth.user.id,
        plan: plan.id
      }
    },
    metadata: {
      user_id: auth.user.id,
      plan: plan.id
    },
    allow_promotion_codes: true
  });

  return NextResponse.json({ url: session.url });
}
