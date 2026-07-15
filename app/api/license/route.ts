import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { plans, type PlanId } from "../../../lib/plans";
import { recoverStripeProfile, syncStripeSubscriptionProfile } from "../../../lib/subscription";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: storedProfile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!storedProfile) return NextResponse.json({ active: false, reason: "no_profile" });

  let profile = storedProfile;
  try {
    if (profile.stripe_subscription_id) {
      profile = await syncStripeSubscriptionProfile(auth.supabase, profile);
    } else {
      profile = await recoverStripeProfile(auth.supabase, profile, auth.user.email);
    }
  } catch (syncError) {
    console.error("Stripe license sync failed", syncError);
    try {
      profile = await recoverStripeProfile(auth.supabase, profile, auth.user.email);
    } catch (recoveryError) {
      console.error("Stripe license recovery failed", recoveryError);
    }
  }

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
