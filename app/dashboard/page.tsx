"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../../lib/company";
import { createBrowserSupabase } from "../../lib/supabase";
import { plans, type PlanId } from "../../lib/plans";

type Profile = {
  selected_plan: PlanId | null;
  company_name: string | null;
  business_id: string | null;
  vat_id: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  receipts_used: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState<PlanId>("pro");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [vatId, setVatId] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [managingPaymentMethod, setManagingPaymentMethod] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const checkoutStarted = useRef(false);

  function saveCompanyDraft(values = { companyName, businessId, vatId }) {
    window.localStorage.setItem("checkappCompanyDraft", JSON.stringify(values));
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPlan = params.get("plan");
    if (urlPlan === "basic" || urlPlan === "pro" || urlPlan === "premium") setPlan(urlPlan);
    if (params.get("payment_method") === "processing") {
      setMessage("Maksutapaa vahvistetaan. Tiedot päivittyvät automaattisesti.");
      params.delete("payment_method");
      const cleanQuery = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`);
    }
    const draft = window.localStorage.getItem("checkappCompanyDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as { companyName?: string; businessId?: string; vatId?: string | null };
        setCompanyName(parsed.companyName ?? "");
        setBusinessId(parsed.businessId ?? "");
        setVatId(parsed.vatId ?? "");
      } catch {
        window.localStorage.removeItem("checkappCompanyDraft");
      }
    }
    void loadProfile();
  }, []);

  useEffect(() => {
    if (loading || (!companyName && !businessId && !vatId)) return;
    saveCompanyDraft();
  }, [companyName, businessId, vatId, loading]);

  useEffect(() => {
    if (loading || checkoutStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "1") return;

    checkoutStarted.current = true;
    params.delete("checkout");
    const nextQuery = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
    void checkout();
  }, [loading]);

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
      headers: { authorization: `Bearer ${sessionToken}` },
      cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Tilin tietojen lataaminen epäonnistui.");
      setLoading(false);
      return;
    }
    setProfile(data.profile ?? null);
    setHasPaymentMethod(Boolean(data.hasPaymentMethod));
    setUserEmail(data.user?.email ?? "");
    if (data.profile?.selected_plan) setPlan(data.profile.selected_plan);
    const metadata = data.user?.metadata ?? {};
    const storedCompanyName = data.profile?.company_name ?? metadata.company_name;
    const storedBusinessId = data.profile?.business_id ?? metadata.business_id;
    const storedVatId = data.profile?.vat_id ?? metadata.vat_id;
    if (storedCompanyName) setCompanyName(storedCompanyName);
    if (storedBusinessId) setBusinessId(storedBusinessId);
    if (storedVatId) setVatId(storedVatId);
    setEditingCompany(!data.profile?.company_name || !data.profile?.business_id);
    setLoading(false);
  }

  function companyPayload() {
    return cleanCompanyInput({ companyName, businessId, vatId });
  }

  function validateCompany() {
    const company = companyPayload();
    if (!company.companyName || !company.businessId) {
      setMessage("Täytä yrityksen nimi ja Y-tunnus.");
      return null;
    }
    if (!isValidFinnishBusinessId(company.businessId)) {
      setMessage("Tarkista Y-tunnus. Käytä muotoa 1234567-8.");
      return null;
    }
    return company;
  }

  async function saveCompany() {
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");
    const company = validateCompany();
    if (!company) return;

    setSavingCompany(true);
    setMessage("");
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
      body: JSON.stringify({ ...company, email: userEmail })
    });
    const data = await response.json();
    setSavingCompany(false);
    if (!response.ok) return setMessage(data.error ?? "Yritystietojen tallennus epäonnistui.");
    const savedCompanyName = data.profile?.company_name ?? "";
    const savedBusinessId = data.profile?.business_id ?? "";
    const savedVatId = data.profile?.vat_id ?? "";
    if (savedCompanyName !== company.companyName || savedBusinessId !== company.businessId) {
      setMessage("Yritystietojen tallennusta ei voitu vahvistaa. Yritä uudelleen.");
      return;
    }
    setProfile(data.profile);
    setUserEmail(data.email ?? userEmail);
    setCompanyName(savedCompanyName);
    setBusinessId(savedBusinessId);
    setVatId(savedVatId);
    setEditingCompany(false);
    saveCompanyDraft({ companyName: savedCompanyName, businessId: savedBusinessId, vatId: savedVatId });
    setMessage("Yritystiedot tallennettu.");
  }

  async function checkout() {
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");
    const company = validateCompany();
    if (!company) return;
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ plan, ...company })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Maksun aloitus epäonnistui.");
    window.localStorage.removeItem("checkappCompanyDraft");
    window.location.href = data.url;
  }

  async function managePaymentMethod() {
    if (managingPaymentMethod) return;
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");

    setManagingPaymentMethod(true);
    setMessage("");
    const response = await fetch("/api/payment-method", {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}` },
      cache: "no-store"
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.url) {
      setManagingPaymentMethod(false);
      return setMessage(data?.error ?? "Stripe-maksutavan avaaminen epäonnistui.");
    }
    window.location.assign(data.url);
  }

  async function downloadApp() {
    if (downloading || !hasPaymentMethod) return;
    const sessionToken = await token();
    if (!sessionToken) return setMessage("Kirjaudu ensin sisään.");

    setDownloading(true);
    setMessage("");
    const response = await fetch("/api/download", {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}` },
      cache: "no-store"
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.url) {
      setDownloading(false);
      setHasPaymentMethod(false);
      return setMessage(data?.error ?? "Latauksen avaaminen epäonnistui.");
    }
    window.location.assign(data.url);
  }

  const hasCurrentSubscription = Boolean(profile?.stripe_subscription_id && profile?.subscription_status && !["canceled", "incomplete_expired"].includes(profile.subscription_status));
  const trialAlreadyUsed = Boolean(profile?.trial_started_at);
  const receiptQuota = plans[profile?.selected_plan ?? plan].quota;
  const receiptsUsed = profile?.receipts_used ?? 0;
  const receiptsRemaining = Math.max(0, receiptQuota - receiptsUsed);
  const trialEndLabel = profile?.trial_ends_at
    ? new Intl.DateTimeFormat("fi-FI", { dateStyle: "short", timeStyle: "short" }).format(new Date(profile.trial_ends_at))
    : "Ei aloitettu";
  const statusLabel = profile?.subscription_status === "trialing"
    ? "Maksuton kokeilu"
    : profile?.subscription_status === "active"
      ? "Aktiivinen tilaus"
      : profile?.subscription_status === "past_due"
        ? "Maksu myöhässä"
        : profile?.subscription_status ?? "Ei aktiivista tilausta";

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
        vatId,
        email: invoiceEmail,
        note: "Yrityslaskupyyntö CheckApp-sivustolta"
      })
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "Laskupyynnön lähetys epäonnistui.");
    setMessage("Laskupyyntö lähetetty. Otamme yhteyttä sähköpostitse.");
  }

  async function signOut() {
    setSigningOut(true);
    setMessage("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      setMessage(error.message);
      return;
    }
    window.location.href = "/";
  }

  return (
    <>
      <header className="siteHeader">
        <BrandLogo href="/" />
        <nav>
          <a href="/">Etusivu</a>
          <a href="/#pricing">Hinnat</a>
          <a href="/#security">Tietoturva</a>
          <button className="button secondary navButton" onClick={signOut} disabled={signingOut}>
            {signingOut ? "Kirjaudutaan ulos..." : "Kirjaudu ulos"}
          </button>
        </nav>
      </header>
      <main className="accountPage">
        <section className="accountCard">
          <p className="eyebrow">Oma tili</p>
          <h1>Hallinnoi kokeilua ja tilausta</h1>
          {loading ? <p>Ladataan...</p> : (
            <>
              <div className="accountGrid">
                <div>
                  <b>Sähköposti</b>
                  {editingCompany
                    ? <input type="email" value={userEmail} onChange={(event) => setUserEmail(event.target.value)} />
                    : <span>{userEmail || "Ei tiedossa"}</span>}
                </div>
                <div>
                  <b>Yritys</b>
                  {editingCompany
                    ? <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Yritys Oy" />
                    : <span>{companyName || "Puuttuu"}</span>}
                </div>
                <div>
                  <b>Y-tunnus</b>
                  {editingCompany && !profile?.business_id
                    ? <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="1234567-8" />
                    : <input className="lockedAccountField" value={businessId} disabled title="Y-tunnusta ei voi muuttaa tallennuksen jälkeen." />}
                </div>
                <div>
                  <b>ALV-tunnus</b>
                  {editingCompany
                    ? <input value={vatId} onChange={(event) => setVatId(event.target.value)} placeholder="FI12345678" />
                    : <span>{vatId || "Ei ilmoitettu"}</span>}
                </div>
                <div><b>Paketti</b><span>{profile?.selected_plan ? plans[profile.selected_plan].name : plans[plan].name}</span></div>
                <div><b>Tila</b><span>{statusLabel}</span></div>
                <div>
                  <b>Kuitit</b>
                  <span>Käytetty {receiptsUsed} / {receiptQuota}</span>
                  <small>Jäljellä {receiptsRemaining} kuittia</small>
                </div>
                <div><b>Trial voimassa asti</b><span>{trialEndLabel}</span></div>
                <div className="accountActionCell">
                  <b>Maksutapa</b>
                  <button className="button secondary compactButton" onClick={managePaymentMethod} disabled={managingPaymentMethod}>
                    {managingPaymentMethod ? "Avataan Stripe..." : "Hallinnoi maksutapaa"}
                  </button>
                </div>
              </div>
              <div className="actions accountEditActions">
                {editingCompany ? (
                  <button className="button primary" onClick={saveCompany} disabled={savingCompany || !userEmail || !companyName || !businessId}>
                    {savingCompany ? "Tallennetaan..." : "Tallenna"}
                  </button>
                ) : (
                  <button className="button secondary" onClick={() => { setEditingCompany(true); setMessage(""); }}>
                    Muokkaa tiedot
                  </button>
                )}
                {hasPaymentMethod ? (
                  <button className="button secondary" onClick={downloadApp} disabled={downloading}>
                    {downloading ? "Avataan lataus..." : "Lataa CheckApp Macille"}
                  </button>
                ) : (
                  <button className="button secondary" disabled title="Lisää ja tallenna maksutapa ensin Stripessä.">
                    Lataa CheckApp Macille
                  </button>
                )}
              </div>
              {!hasPaymentMethod && <p className="helperText">CheckAppin lataus aktivoituu, kun maksutapa on lisätty ja tallennettu Stripessä.</p>}
              <label>
                Valitse paketti
                <select value={plan} onChange={(event) => setPlan(event.target.value as PlanId)}>
                  {Object.values(plans).map((item) => <option value={item.id} key={item.id}>{item.name} - {item.price}/kk + ALV</option>)}
                </select>
              </label>
              <p className="helperText">
                {plans[plan].name}: {plans[plan].price}/kk + ALV, {plans[plan].quota} kuittia/kk ja 7 päivän kokeilujakso.
              </p>
              <p className="helperText">
                Maksuton kokeilu on yrityskohtainen. Jos sama Y-tunnus on jo käyttänyt kokeilun, tilaus alkaa maksullisena heti Stripe Checkoutissa.
              </p>
              <p className="helperText">
                Maksutapa lisätään turvallisesti Stripe Checkoutissa. Uusi tilaus sisältää 7 päivän maksuttoman kokeilun
                ja jatkuu sen jälkeen maksullisena, ellei sitä peruta ennen kokeilun päättymistä. Tilauksen voi perua milloin tahansa.
              </p>
              <p className="helperText">Jos perut tilauksen kokeilun aikana, sinua ei veloiteta.</p>
              <p className="helperText">
                Mac voi ensimmäisellä avauskerralla varoittaa, koska CheckApp ladataan verkkosivulta eikä App Storesta.
                Avaa sovellus tarvittaessa Finderissa: ctrl-klikkaa CheckAppia, valitse Avaa ja vahvista Avaa.
              </p>
              <div className="actions">
                {!hasCurrentSubscription && (
                  <button className="button primary" onClick={checkout} disabled={!companyName || !businessId}>
                    {trialAlreadyUsed ? "Jatka maksulliseen tilaukseen" : "Aloita 7 päivän kokeilu"}
                  </button>
                )}
              </div>
              <div className="invoiceBox">
                <h2>Yrityslasku</h2>
                <p>Jos haluat maksaa laskulla, lähetä laskutuspyyntö. Kokeilu voi alkaa heti, ja laskutus sovitaan erikseen.</p>
                <div className="formGrid">
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
