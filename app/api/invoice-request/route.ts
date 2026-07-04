import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getPlan } from "../../../lib/plans";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const plan = getPlan(body.plan);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  if (!body.companyName || !body.email) {
    return NextResponse.json({ error: "Company name and email are required." }, { status: 400 });
  }

  const { error } = await auth.supabase.from("company_invoice_requests").insert({
    user_id: auth.user.id,
    company_name: body.companyName,
    business_id: body.businessId ?? null,
    email: body.email,
    plan: plan.id,
    note: body.note ?? null
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
