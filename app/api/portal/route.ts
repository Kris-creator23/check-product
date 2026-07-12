import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { siteContent } from "../../../lib/siteContent";
import { getStripe } from "../../../lib/stripe";
import { recoverStripeProfile } from "../../../lib/subscription";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: storedProfile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let profile = storedProfile;
  if (profile && !profile.stripe_customer_id) {
    try {
      profile = await recoverStripeProfile(auth.supabase, profile, auth.user.email);
    } catch (syncError) {
      console.error("Stripe portal recovery failed", syncError);
    }
  }
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({
      error: `Maksutapaa ei ole vielä lisätty. Jos tarvitset apua, ota yhteyttä: ${siteContent.supportEmail}.`
    }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/dashboard`
  });

  return NextResponse.json({ url: session.url });
}
