"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { createBrowserSupabase } from "../../lib/supabase";

export default function PaymentMethodPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [message, setMessage] = useState("Avataan Stripe-maksutavan hallintaa...");

  useEffect(() => {
    async function openStripe() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessage("Istunto on vanhentunut. Kirjaudu uudelleen ja yritä sitten uudestaan.");
        return;
      }

      const response = await fetch("/api/payment-method", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.url) {
        setMessage(result?.error ?? "Stripe-maksutavan avaaminen epäonnistui.");
        return;
      }

      window.location.assign(result.url);
    }

    void openStripe();
  }, [supabase]);

  return (
    <main className="accountPage">
      <section className="accountCard paymentMethodRedirect">
        <BrandLogo href="/" />
        <h1>Maksutapa</h1>
        <p>{message}</p>
        <div className="actions">
          <a className="button secondary" href="/dashboard">Takaisin omalle tilille</a>
        </div>
      </section>
    </main>
  );
}
