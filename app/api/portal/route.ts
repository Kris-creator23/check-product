import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Payment method has not been added yet." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/dashboard`
  });

  return NextResponse.json({ url: session.url });
}
