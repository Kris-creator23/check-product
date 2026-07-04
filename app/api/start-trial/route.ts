import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
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
    .select("trial_started_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

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
      ...patch
    }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    downloadUrl: "/api/download"
  });
}
