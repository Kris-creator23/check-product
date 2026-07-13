import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("stripe_subscription_id, subscription_status, trial_ends_at, trial_started_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) {
    return NextResponse.json({ error: "Profiili puuttuu. Tallenna ensin yritystiedot." }, { status: 403 });
  }

  // Check if user has active subscription or valid trial
  const now = new Date();
  const hasActiveSubscription = profile.subscription_status === "active";
  const hasTrialActive = profile.subscription_status === "trialing" && 
    profile.trial_ends_at && 
    new Date(profile.trial_ends_at) > now;

  if (!hasActiveSubscription && !hasTrialActive) {
    return NextResponse.json({ 
      error: "Tilaus on passiivinen tai kokeilu on päättynyt. Aloita uusi tilaus." 
    }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL;
  if (!url) {
    return NextResponse.json({ error: "Download URL is not configured." }, { status: 500 });
  }

  return NextResponse.json({ url });
}
