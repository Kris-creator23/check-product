"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function finishLogin() {
      const supabase = createBrowserSupabase();
      const code = searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      router.replace("/dashboard");
    }

    void finishLogin();
  }, [router, searchParams]);

  return (
    <main className="accountPage">
      <section className="accountCard">
        <p className="eyebrow">Kirjautuminen</p>
        <h1>Viimeistellään kirjautuminen...</h1>
        <p>Hetki, ohjaamme sinut omalle tilille.</p>
      </section>
    </main>
  );
}
