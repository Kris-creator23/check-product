import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../../../lib/company";
import { syncStripeSubscriptionProfile } from "../../../lib/subscription";

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
  if (profile?.stripe_subscription_id) {
    try {
      profile = await syncStripeSubscriptionProfile(auth.supabase, profile);
    } catch (syncError) {
      console.error("Stripe profile sync failed", syncError);
    }
  }

  return NextResponse.json({
    profile,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      metadata: auth.user.user_metadata
    }
  });
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
    .select("business_id")
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

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .upsert({
      user_id: auth.user.id,
      email: auth.user.email,
      company_name: company.companyName,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      vat_id: company.vatId
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: metadataError } = await auth.supabase.auth.admin.updateUserById(auth.user.id, {
    user_metadata: {
      ...auth.user.user_metadata,
      company_name: company.companyName,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      vat_id: company.vatId
    }
  });
  if (metadataError) {
    console.error("Company metadata sync failed", metadataError);
  }

  return NextResponse.json({ profile });
}
