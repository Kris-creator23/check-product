"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "../../lib/supabase";

type CheckoutSummary = {
  plan: { id: string; name: string; price: string } | null;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  chargedImmediately: boolean;
};

export default function SuccessPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [message, setMessage] = useState("Vahvistetaan tilausta...");

  useEffect(() => {
    async function loadSummary() {
      const sessionId = new URLSearchParams(window.location.search).get("session_id");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!sessionId || !token) {
        setMessage("Tilaus on vastaanotettu. Tarkista tiedot omalta tililtä.");
        return;
      }

      const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Tilauksen tietojen lataaminen epäonnistui.");
        return;
      }
      setSummary(result);
      setMessage("");
    }

    void loadSummary();
  }, [supabase]);

  const trialEndLabel = summary?.trialEndsAt
    ? new Intl.DateTimeFormat("fi-FI", { dateStyle: "long", timeStyle: "short" }).format(new Date(summary.trialEndsAt))
    : null;

  return (
    <main className="accountPage">
      <section className="accountCard">
        <p className="eyebrow">Maksutapa lisätty</p>
        <h1>CheckApp on valmis käyttöön</h1>
        {summary?.plan && <p><b>{summary.plan.name}</b>: {summary.plan.price}/kk + ALV.</p>}
        {summary?.chargedImmediately ? (
          <p>Maksuton kokeilu oli jo käytetty, joten maksullinen tilaus alkoi heti.</p>
        ) : trialEndLabel ? (
          <p>Tänään ei veloitettu. Maksuton kokeilu on voimassa <b>{trialEndLabel}</b> asti. Ensimmäinen maksu veloitetaan tämän jälkeen, ellei tilausta peruta ennen kokeilun päättymistä.</p>
        ) : null}
        <p>Voit hallita tai perua tilauksen milloin tahansa omalta tililtä Stripe Customer Portalissa.</p>
        {message && <p className="message">{message}</p>}
        <p>Mac voi ensimmäisellä avauskerralla varoittaa, koska CheckApp ladataan verkkosivulta eikä App Storesta. Avaa sovellus tarvittaessa Finderissa: ctrl-klikkaa CheckAppia, valitse Avaa ja vahvista Avaa.</p>
        <div className="actions">
          <a className="button primary" href="/api/download">Lataa CheckApp Macille</a>
          <a className="button secondary" href="/dashboard">Oma tili</a>
        </div>
      </section>
    </main>
  );
}
