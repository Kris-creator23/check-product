import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../../../lib/company";
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
    .select("stripe_customer_id, company_name, business_id, business_id_normalized, vat_id, trial_started_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const metadata = auth.user.user_metadata as Record<string, string | undefined>;
  const company = cleanCompanyInput({
    companyName: body.companyName ?? profile?.company_name ?? metadata.company_name,
    businessId: body.businessId ?? profile?.business_id ?? metadata.business_id,
    vatId: body.vatId ?? profile?.vat_id ?? metadata.vat_id
  });

  if (!company.companyName || !company.businessId) {
    return NextResponse.json({ error: "Yrityksen nimi ja Y-tunnus ovat pakollisia." }, { status: 400 });
  }

  if (!isValidFinnishBusinessId(company.businessId)) {
    return NextResponse.json({ error: "Tarkista Y-tunnus. Käytä muotoa 1234567-8." }, { status: 400 });
  }

  const { data: existingCompanyTrials, error: trialLookupError } = await auth.supabase
    .from("profiles")
    .select("user_id")
    .eq("business_id_normalized", company.businessIdNormalized)
    .not("trial_started_at", "is", null)
    .limit(1);

  if (trialLookupError) return NextResponse.json({ error: trialLookupError.message }, { status: 500 });
  const companyHasUsedTrial = Boolean(profile?.trial_started_at || existingCompanyTrials?.length);

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user.email,
      name: company.companyName,
      metadata: {
        user_id: auth.user.id,
        company_name: company.companyName,
        business_id: company.businessId,
        vat_id: company.vatId ?? ""
      }
    });
    customerId = customer.id;
  }

  await auth.supabase.from("profiles").upsert({
    user_id: auth.user.id,
    email: auth.user.email,
    company_name: company.companyName,
    business_id: company.businessId,
    business_id_normalized: company.businessIdNormalized,
    vat_id: company.vatId,
    selected_plan: plan.id,
    stripe_customer_id: customerId,
    ...(companyHasUsedTrial ? { subscription_status: "payment_required_no_trial" } : {})
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
    custom_text: {
      submit: {
        message: companyHasUsedTrial
          ? "Tällä Y-tunnuksella maksuton kokeilu on jo käytetty. Tilaus alkaa maksullisena heti, ja sitä voi hallita Stripe Customer Portalissa."
          : "7 päivän kokeilun jälkeen tilaus muuttuu maksulliseksi, ellei sitä peruta ennen kokeilun päättymistä. Tilausta voi hallita Stripe Customer Portalissa."
      }
    },
    subscription_data: {
      ...(companyHasUsedTrial ? {} : { trial_period_days: 7 }),
      metadata: {
        user_id: auth.user.id,
        plan: plan.id,
        business_id: company.businessId,
        business_id_normalized: company.businessIdNormalized,
        trial_mode: companyHasUsedTrial ? "none" : "seven_days"
      }
    },
    metadata: {
      user_id: auth.user.id,
      plan: plan.id,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      trial_mode: companyHasUsedTrial ? "none" : "seven_days"
    },
    allow_promotion_codes: true
  });

  return NextResponse.json({ url: session.url });
}
