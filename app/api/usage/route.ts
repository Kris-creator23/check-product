import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { plans, type PlanId } from "../../../lib/plans";

const allowedFields = new Set(["count"]);

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid usage payload." }, { status: 400 });
  }

  const fields = Object.keys(body);
  if (fields.some((field) => !allowedFields.has(field))) {
    return NextResponse.json({ error: "Usage payload may only include count." }, { status: 400 });
  }

  const count = Number((body as { count?: unknown }).count);
  if (!Number.isInteger(count) || count !== 1) {
    return NextResponse.json({ error: "Usage count must be exactly 1." }, { status: 400 });
  }

  const { data: profile, error: readError } = await auth.supabase
    .from("profiles")
    .select("receipts_used, selected_plan, trial_ends_at, subscription_status")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const selectedPlan = profile?.selected_plan as PlanId | null;
  const quota = selectedPlan ? plans[selectedPlan]?.quota ?? 0 : 0;
  const receiptsUsedBefore = profile?.receipts_used ?? 0;
  const trialActive = profile?.trial_ends_at ? new Date(profile.trial_ends_at).getTime() > Date.now() : false;
  const paidActive = profile?.subscription_status === "active";
  if (!trialActive && !paidActive) {
    return NextResponse.json({ error: "subscription inactive" }, { status: 403 });
  }
  if (receiptsUsedBefore >= quota) {
    return NextResponse.json({ error: "usage limit reached" }, { status: 403 });
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ receipts_used: receiptsUsedBefore + count })
    .eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const receiptsUsed = receiptsUsedBefore + count;

  return NextResponse.json({
    ok: true,
    receiptsUsed,
    quota,
    receiptsRemaining: Math.max(0, quota - receiptsUsed)
  });
}
