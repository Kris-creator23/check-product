import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../../../lib/company";
import { recoverStripeProfile, syncStripeSubscriptionProfile } from "../../../lib/subscription";
import { getStripe } from "../../../lib/stripe";

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: storedProfile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let profile = storedProfile;
  let hasPaymentMethod = false;
  if (profile) {
    try {
      profile = profile.stripe_subscription_id
        ? await syncStripeSubscriptionProfile(auth.supabase, profile)
        : await recoverStripeProfile(auth.supabase, profile, auth.user.email);
    } catch (syncError) {
      console.error("Stripe profile sync failed", syncError);
      try {
        profile = await recoverStripeProfile(auth.supabase, profile, auth.user.email);
      } catch (recoveryError) {
        console.error("Stripe profile recovery failed", recoveryError);
      }
    }

    if (profile?.stripe_customer_id) {
      try {
        const paymentMethods = await getStripe().paymentMethods.list({
          customer: profile.stripe_customer_id,
          type: "card",
          limit: 1
        });
        hasPaymentMethod = paymentMethods.data.length > 0;
        const paymentMethod = paymentMethods.data[0] ?? null;
        const { data: syncedProfile, error: paymentStateError } = await auth.supabase
          .from("profiles")
          .update({
            payment_method_ready: hasPaymentMethod,
            stripe_payment_method_id: paymentMethod?.id ?? null,
            ...(paymentMethod && !profile.payment_method_added_at
              ? { payment_method_added_at: new Date().toISOString() }
              : {})
          })
          .eq("user_id", auth.user.id)
          .select("*")
          .single();
        if (paymentStateError) throw paymentStateError;
        profile = syncedProfile;
      } catch (paymentMethodError) {
        console.error("Stripe payment method lookup failed", paymentMethodError);
      }
    }
    if (!profile?.stripe_customer_id && profile?.payment_method_ready) {
      const { data: syncedProfile } = await auth.supabase
        .from("profiles")
        .update({ payment_method_ready: false, stripe_payment_method_id: null })
        .eq("user_id", auth.user.id)
        .select("*")
        .single();
      if (syncedProfile) profile = syncedProfile;
    }
  }

  return NextResponse.json({
    profile,
    hasPaymentMethod,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      metadata: auth.user.user_metadata
    }
  }, { headers: noStoreHeaders });
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Virheelliset yritystiedot." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const requestedCompany = cleanCompanyInput({
    companyName: body.companyName,
    businessId: body.businessId,
    vatId: body.vatId
  });

  if (existing?.business_id && requestedCompany.businessId !== existing.business_id) {
    return NextResponse.json({
      error: "Y-tunnusta ei voi muuttaa tallennuksen jälkeen. Ota yhteyttä asiakaspalveluun, jos tiedoissa on virhe."
    }, { status: 409 });
  }

  const company = cleanCompanyInput({
    companyName: requestedCompany.companyName,
    businessId: existing?.business_id ?? requestedCompany.businessId,
    vatId: requestedCompany.vatId
  });

  if (!company.companyName || !company.businessId) {
    return NextResponse.json({ error: "Yrityksen nimi ja Y-tunnus ovat pakollisia." }, { status: 400 });
  }
  if (!isValidFinnishBusinessId(company.businessId)) {
    return NextResponse.json({ error: "Tarkista Y-tunnus. Käytä muotoa 1234567-8." }, { status: 400 });
  }

  const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!requestedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
    return NextResponse.json({ error: "Tarkista sähköpostiosoite." }, { status: 400 });
  }

  const { error: authUpdateError } = await auth.supabase.auth.admin.updateUserById(auth.user.id, {
    email: requestedEmail,
    email_confirm: true,
    user_metadata: {
      ...auth.user.user_metadata,
      company_name: company.companyName,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      vat_id: company.vatId
    }
  });
  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .upsert({
      user_id: auth.user.id,
      email: requestedEmail,
      company_name: company.companyName,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      vat_id: company.vatId
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile, email: requestedEmail }, { headers: noStoreHeaders });
}
