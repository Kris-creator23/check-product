"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishLogin() {
      const supabase = createBrowserSupabase();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const plan = params.get("plan");
      const checkout = params.get("checkout");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else {
        await supabase.auth.getSession();
      }

      const dashboardParams = new URLSearchParams();
      if (plan === "basic" || plan === "pro" || plan === "premium") dashboardParams.set("plan", plan);
      if (checkout === "1") dashboardParams.set("checkout", "1");
      const query = dashboardParams.toString();
      router.replace(`/dashboard${query ? `?${query}` : ""}`);
    }

    void finishLogin();
  }, [router]);

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
