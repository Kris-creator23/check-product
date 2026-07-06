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

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Anna kelvollinen sähköpostiosoite." }, { status: 400 });
  }

  const { error } = await getAuthClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false }
  });

  if (error) {
    return NextResponse.json({
      error: "Sähköpostilla ei löytynyt aktiivista CheckApp-tiliä. Rekisteröidy tai aloita kokeilu ensin osoitteessa https://checkapp.fi."
    }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
