import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../../../lib/company";
import { getPlan } from "../../../lib/plans";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const plan = getPlan(body.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await auth.supabase
    .from("profiles")
    .select("trial_started_at, company_name, business_id, business_id_normalized, vat_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const metadata = auth.user.user_metadata as Record<string, string | undefined>;
  const company = cleanCompanyInput({
    companyName: body.companyName ?? existing?.company_name ?? metadata.company_name,
    businessId: body.businessId ?? existing?.business_id ?? metadata.business_id,
    vatId: body.vatId ?? existing?.vat_id ?? metadata.vat_id
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

  const companyHasUsedTrial = Boolean(existingCompanyTrials?.some((item) => item.user_id !== auth.user.id));
  if (companyHasUsedTrial && !existing?.trial_started_at) {
    await auth.supabase.from("profiles").upsert({
      user_id: auth.user.id,
      email: auth.user.email,
      company_name: company.companyName,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      vat_id: company.vatId,
      selected_plan: plan.id,
      subscription_status: "trial_used_payment_required"
    }, { onConflict: "user_id" });

    return NextResponse.json({
      error: "Tällä Y-tunnuksella on jo käytetty maksuton kokeilu. Voit jatkaa tilaamalla ilman uutta kokeilujaksoa.",
      requiresPayment: true
    }, { status: 409 });
  }

  const patch = existing?.trial_started_at
    ? { selected_plan: plan.id }
    : {
        selected_plan: plan.id,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt,
        subscription_status: "trialing_no_payment_method"
      };

  const { error } = await auth.supabase
    .from("profiles")
    .upsert({
      user_id: auth.user.id,
      email: auth.user.email,
      company_name: company.companyName,
      business_id: company.businessId,
      business_id_normalized: company.businessIdNormalized,
      vat_id: company.vatId,
      ...patch
    }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    downloadUrl: "/api/download"
  });
}
