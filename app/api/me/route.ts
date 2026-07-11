import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../../../lib/company";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  const body = await request.json();
  const company = cleanCompanyInput({
    companyName: body.companyName,
    businessId: body.businessId,
    vatId: body.vatId
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
  return NextResponse.json({ profile });
}
