import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return createClient(url, key);
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.code ?? "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Anna kelvollinen sähköpostiosoite." }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "Anna sähköpostiin lähetetty koodi." }, { status: 400 });
  }

  const { data, error } = await getAuthClient().auth.verifyOtp({
    email,
    token,
    type: "magiclink"
  });

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? "Kirjautuminen epäonnistui." }, { status: 401 });
  }

  return NextResponse.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
    user: { id: data.user?.id, email: data.user?.email }
  });
}
