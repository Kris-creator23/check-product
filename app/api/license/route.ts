import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { plans, type PlanId } from "../../../lib/plans";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile) return NextResponse.json({ active: false, reason: "no_profile" });

  const selectedPlan = profile.selected_plan as PlanId | null;
  const plan = selectedPlan ? plans[selectedPlan] : null;
  const trialActive = profile.trial_ends_at ? new Date(profile.trial_ends_at).getTime() > Date.now() : false;
  const paidActive = profile.subscription_status === "active";
  const quota = plan?.quota ?? 0;
  const receiptsUsed = profile.receipts_used ?? 0;
  const receiptsRemaining = Math.max(0, quota - receiptsUsed);
  const active = (trialActive || paidActive) && receiptsUsed < quota;
  const reason = receiptsUsed >= quota
    ? "quota_exceeded"
    : !trialActive && !paidActive && profile.trial_ends_at
      ? "trial_expired"
      : !active
        ? "subscription_inactive"
        : null;

  return NextResponse.json({
    active,
    plan: selectedPlan,
    quota,
    receiptsUsed,
    receiptsRemaining,
    trialEndsAt: profile.trial_ends_at,
    subscriptionStatus: profile.subscription_status,
    reason
  });
}
