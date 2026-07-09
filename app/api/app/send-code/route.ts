import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "../../../../lib/supabase";

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

  const { data: profile, error: profileError } = await createAdminSupabase()
    .from("profiles")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({
      error: "Sähköpostilla ei löytynyt aktiivista CheckApp-tiliä. Rekisteröidy tai aloita kokeilu ensin osoitteessa https://checkapp.fi."
    }, { status: 400 });
  }

  const { error } = await getAuthClient().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false
    }
  });

  if (error) {
    const debugCode = error.code ?? `supabase_${error.status ?? "unknown"}`;

    console.error("CheckApp login code send failed", {
      email,
      status: error.status,
      code: debugCode,
      message: error.message
    });

    return NextResponse.json({
      error: "Kirjautumiskoodia ei voitu lähettää. Kokeile hetken kuluttua uudelleen tai kirjaudu salasanalla.",
      debugCode,
      debugMessage: error.message
    }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
