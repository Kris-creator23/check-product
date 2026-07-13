import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { getStripe } from "../../../lib/stripe";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Lisää ja tallenna maksutapa ensin." }, { status: 403 });
  }

  const cards = await getStripe().paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: "card",
    limit: 1
  });
  if (cards.data.length === 0) {
    return NextResponse.json({ error: "Lisää ja tallenna maksutapa ensin." }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL;
  if (!url) {
    return NextResponse.json({ error: "Download URL is not configured." }, { status: 500 });
  }

  return NextResponse.json({ url });
}
