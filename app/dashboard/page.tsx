"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { createBrowserSupabase } from "../../lib/supabase";
import { plans, type PlanId } from "../../lib/plans";
import { siteContent } from "../../lib/siteContent";

type Profile = {
  selected_plan: PlanId | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  receipts_used: number | null;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<PlanId>("pro");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [b2bAccepted, setB2bAccepted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPlan = params.get("plan");
    if (urlPlan === "basic" || urlPlan === "pro" || urlPlan === "premium") setPlan(urlPlan);
    void loadProfile();
  }, []);

  async function token() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function loadProfile() {
    setLoading(true);
    const sessionToken = await token();
    if (!sessionToken) {
      setMessage("Kirjaudu ensin sisään etusivulla.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/me", {
      headers: { authorization: `Bearer ${sessionToken}` }
    });
    const data = await response.json();
    setProfile(data.profile ?? null);
    if (data.profile?.selected_plan) setPlan(data.profile.selected_plan);
    setLoading(false);
  }

  async function startTrial() {
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");
    if (!b2bAccepted) {
      return setMessage("Vahvista ensin, että käytät CheckAppia yrityksenä tai organisaation edustajana.");
    }

    const response = await fetch("/api/start-trial", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ plan })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Kokeilun aloitus epäonnistui.");
    window.location.href = data.downloadUrl;
  }

  async function checkout() {
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");
    if (!b2bAccepted) {
      return setMessage("Vahvista ensin, että käytät CheckAppia yrityksenä tai organisaation edustajana.");
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ plan })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Maksun aloitus epäonnistui.");
    window.location.href = data.url;
  }

  async function portal() {
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");

    const response = await fetch("/api/portal", {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}` }
    });
    const data = await response.json();
    if (!response.ok) {
      return setMessage(data.error ?? `Asiakasportaalin avaaminen epäonnistui. Ota yhteyttä: ${siteContent.supportEmail}.`);
    }
    window.location.href = data.url;
  }

  async function requestInvoice() {
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");

    const response = await fetch("/api/invoice-request", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({
        plan,
        companyName,
        businessId,
        email: invoiceEmail,
        note: "Yrityslaskupyyntö CheckApp-sivustolta"
      })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Laskupyynnön lähetys epäonnistui.");
    setMessage("Laskupyyntö lähetetty. Otamme yhteyttä sähköpostitse.");
  }

  return (
    <>
      <header className="siteHeader">
        <BrandLogo href="/" />
        <nav>
          <a href="/">Etusivu</a>
          <a href="/#pricing">Hinnat</a>
          <a href="/#security">Tietoturva</a>
        </nav>
      </header>
      <main className="accountPage">
        <section className="accountCard">
          <p className="eyebrow">Oma tili</p>
          <h1>Hallinnoi kokeilua ja tilausta</h1>
          {loading ? <p>Ladataan...</p> : (
            <>
              <div className="accountGrid">
                <div><b>Paketti</b><span>{profile?.selected_plan ? plans[profile.selected_plan].name : plans[plan].name}</span></div>
                <div><b>Tila</b><span>{profile?.subscription_status ?? "trial / ei maksutapaa"}</span></div>
                <div><b>Kuitit</b><span>{profile?.receipts_used ?? 0} / {plans[profile?.selected_plan ?? plan].quota}</span></div>
                <div><b>Trial päättyy</b><span>{profile?.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString("fi-FI") : "Ei aloitettu"}</span></div>
                <div><b>Maksullinen käyttö päättyy</b><span>{profile?.current_period_end ? new Date(profile.current_period_end).toLocaleDateString("fi-FI") : "Ei aktiivista maksukautta"}</span></div>
              </div>
              <label>
                Valitse paketti
                <select value={plan} onChange={(event) => setPlan(event.target.value as PlanId)}>
                  {Object.values(plans).map((item) => <option value={item.id} key={item.id}>{item.name} - {item.price}/kk + ALV</option>)}
                </select>
              </label>
              <p className="helperText">
                {plans[plan].name}: {plans[plan].price}/kk + ALV, {plans[plan].quota} kuittia/kk ja 7 päivän kokeilujakso.
              </p>
              <label className="checkLine">
                <input
                  type="checkbox"
                  checked={b2bAccepted}
                  onChange={(event) => setB2bAccepted(event.target.checked)}
                />
                <span>Vahvistan, että käytän CheckAppia yrityksenä, yksityisenä elinkeinonharjoittajana tai organisaation edustajana, en kuluttajana yksityiseen käyttöön.</span>
              </label>
              <p className="helperText">
                Ilman maksutietoja kokeilu ei muutu automaattisesti maksulliseksi. Jos lisäät maksutavan nyt,
                tilaus jatkuu 7 päivän kokeilun jälkeen maksullisena, ellei sitä peruta ennen kokeilun päättymistä.
                Tilausta voi hallita ja perua Stripe Customer Portalissa ilman sähköpostipyyntöä.
              </p>
              <div className="actions">
                <button className="button primary" onClick={startTrial} disabled={!b2bAccepted}>Lataa Mac-sovellus ilman maksutietoja</button>
                <button className="button secondary" onClick={checkout} disabled={!b2bAccepted}>Lisää maksutapa nyt</button>
                <button className="button secondary" onClick={portal}>Hallinnoi tilausta</button>
              </div>
              <div className="invoiceBox">
                <h2>Yrityslasku</h2>
                <p>Jos haluat maksaa laskulla, lähetä laskutuspyyntö. Kokeilu voi alkaa heti, ja laskutus sovitaan erikseen.</p>
                <div className="formGrid">
                  <label>
                    Yrityksen nimi
                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Yritys Oy" />
                  </label>
                  <label>
                    Y-tunnus
                    <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="1234567-8" />
                  </label>
                  <label>
                    Laskutussähköposti
                    <input value={invoiceEmail} onChange={(event) => setInvoiceEmail(event.target.value)} placeholder="billing@company.fi" type="email" />
                  </label>
                </div>
                <button className="button secondary" onClick={requestInvoice} disabled={!companyName || !invoiceEmail}>
                  Pyydä yrityslasku
                </button>
              </div>
            </>
          )}
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    </>
  );
}
