"use client";

import { useMemo, useState } from "react";
import { BrandLogo } from "./components/BrandLogo";
import { cleanCompanyInput, isValidFinnishBusinessId } from "../lib/company";
import { createBrowserSupabase } from "../lib/supabase";
import { plans, type PlanId } from "../lib/plans";

type PasswordMode = "signin" | "signup";

export default function HomePage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [vatId, setVatId] = useState("");
  const [plan, setPlan] = useState<PlanId>("pro");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>("signup");
  const [b2bAccepted, setB2bAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const company = cleanCompanyInput({ companyName, businessId, vatId });
  const companyRequired = passwordMode === "signup";
  const canSubmit = passwordMode === "signin"
    ? Boolean(email && password)
    : Boolean(email && password && company.companyName && company.businessId && b2bAccepted);

  function validateCompany() {
    if (!company.companyName || !company.businessId) {
      setMessage("Täytä yrityksen nimi ja Y-tunnus.");
      return false;
    }
    if (!isValidFinnishBusinessId(company.businessId)) {
      setMessage("Tarkista Y-tunnus. Käytä muotoa 1234567-8.");
      return false;
    }
    return true;
  }

  function saveCompanyDraft() {
    window.localStorage.setItem("checkappCompanyDraft", JSON.stringify({
      companyName: company.companyName,
      businessId: company.businessId,
      vatId: company.vatId
    }));
  }

  async function signInWithGoogle() {
    if (passwordMode === "signup" && !b2bAccepted) {
      setMessage("Vahvista ensin, että käytät CheckAppia yrityksenä tai organisaation edustajana.");
      return;
    }
    if (passwordMode === "signup") {
      if (!validateCompany()) return;
      saveCompanyDraft();
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?plan=${plan}`
      }
    });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  async function signInWithEmail() {
    if (passwordMode === "signup" && !b2bAccepted) {
      setMessage("Vahvista ensin, että käytät CheckAppia yrityksenä tai organisaation edustajana.");
      return;
    }
    if (passwordMode === "signup" && !validateCompany()) return;

    setBusy(true);
    setMessage("");

    if (passwordMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      setMessage(error ? error.message : "Kirjautuminen onnistui. Siirrytään omalle tilille.");
      if (!error) window.location.href = `/dashboard?plan=${plan}`;
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: company.companyName,
            business_id: company.businessId,
            business_id_normalized: company.businessIdNormalized,
            vat_id: company.vatId
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?plan=${plan}`
        }
      });
      if (!error) saveCompanyDraft();
      setMessage(error ? error.message : "Tili luotu. Tarkista sähköposti, jos vahvistus vaaditaan.");
    }

    setBusy(false);
  }

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">Mac-sovellus Fennoa-käyttäjille</p>
            <h1>Kuitit Fennoaan ilman käsin tehtävää lataamista</h1>
            <p className="heroText">
              CheckApp hakee kuitit valitusta kansiosta, vie ne Fennoaan, täyttää
              tarvittavat kentät ja tallentaa ne Fennoaan. Kokeilu alkaa ilman maksua,
              ja maksuton kokeilu ilman maksutietoja ei muutu automaattisesti maksulliseksi
              tilaukseksi.
            </p>
            <div className="actions">
              <a className="button primary" href="#signup">Aloita 7 päivän kokeilu</a>
              <a className="button secondary" href="#pricing">Katso hinnat</a>
            </div>
            <div className="stats">
              <div><strong>7 pv</strong><span>maksuton kokeilu</span></div>
              <div><strong>50-500</strong><span>kuittia kuukaudessa</span></div>
              <div><strong>B2B</strong><span>yrityksille ja toiminimille</span></div>
            </div>
          </div>

          <div className="window" aria-label="CheckApp-sovelluksen esikatselu">
            <div className="windowBar"><span /><span /><span /></div>
            <div className="appPanel">
              <div className="status ok"><span /><div><b>Fennoa avattu</b><p>Käyttäjä kirjautuu suoraan Fennoaan</p></div></div>
              <div className="folder"><i /><div><b>Kuittikansio</b><p>/Receipts/To upload</p></div></div>
              <div className="queue">
                <div className="queueHead"><b>Latausjono</b><span>Tänään</span></div>
                <div className="receipt"><span>invoice-1042.pdf</span><b>Tallennettu</b></div>
                <div className="receipt active"><span>receipt-market.jpg</span><b>Täytetään</b></div>
                <div className="receipt muted"><span>fuel-0704.pdf</span><b>Odottaa</b></div>
              </div>
              <button className="darkButton">Käynnistä käsittely</button>
            </div>
          </div>
        </section>

        <section className="section split">
          <div>
            <p className="eyebrow">Kenelle</p>
            <h2>Yrittäjille, taloushallinnon tekijöille ja Fennoaa käyttäville yrityksille</h2>
          </div>
          <p>
            CheckApp vähentää toistuvaa työtä: kuittien valitsemista, tiedostojen
            lataamista Fennoaan, kenttien täyttämistä ja tallentamista. Käyttäjä vastaa
            lopullisten tietojen tarkistamisesta Fennoassa.
          </p>
        </section>

        <section className="section" id="pricing">
          <p className="eyebrow">Hinnat</p>
          <h2>Valitse kuittimäärään sopiva paketti</h2>
          <div className="pricingGrid">
            {Object.values(plans).map((item) => (
              <article className={`plan ${item.id === "pro" ? "featured" : ""}`} key={item.id}>
                {item.id === "pro" && <span className="badge">Suosituin</span>}
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="price"><strong>{item.price}</strong><span>/ kk + ALV</span></div>
                <ul>
                  <li>Enintään {item.quota} kuittia kuukaudessa</li>
                  <li>7 päivän maksuton kokeilu</li>
                  <li>Ilman korttia kokeilu ei muutu maksulliseksi automaattisesti</li>
                  <li>Kortilla tilaus jatkuu maksullisena kokeilun jälkeen, ellei sitä peruta ajoissa</li>
                  <li>Apple Pay ja korttimaksut Stripen kautta</li>
                  <li>Yrityslasku pyynnöstä</li>
                </ul>
                <a className="button primary" href="#signup" onClick={() => setPlan(item.id)}>Valitse {item.name}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section split warm" id="signup">
          <div>
            <p className="eyebrow">Rekisteröinti</p>
            <h2>Aloita kokeilu ja lataa Mac-sovellus</h2>
            <p>
              Voit aloittaa ilman maksutietoja ja valita maksutavan myöhemmin. Ilman
              maksutietoja kokeilu ei muutu automaattisesti maksulliseksi. Jos lisäät
              maksutavan heti, tilaus jatkuu 7 päivän kokeilun jälkeen maksullisena,
              ellei sitä peruta ennen kokeilun päättymistä.
            </p>
          </div>
          <div className="signupBox">
            <label>
              Paketti
              <select value={plan} onChange={(event) => setPlan(event.target.value as PlanId)}>
                {Object.values(plans).map((item) => <option value={item.id} key={item.id}>{item.name} - {item.price}/kk + ALV</option>)}
              </select>
            </label>
            <div className="tabs">
              <button className={passwordMode === "signup" ? "selected" : ""} onClick={() => setPasswordMode("signup")}>Rekisteröidy</button>
              <button className={passwordMode === "signin" ? "selected" : ""} onClick={() => setPasswordMode("signin")}>Kirjaudu</button>
            </div>
            <label>
              Sähköposti
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.fi" type="email" />
            </label>
            <label>
              Salasana
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Vähintään 8 merkkiä" type="password" />
            </label>
            {companyRequired && (
              <>
                <label>
                  Yrityksen nimi
                  <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Yritys Oy" />
                </label>
                <label>
                  Y-tunnus
                  <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} placeholder="1234567-8" />
                </label>
                <label>
                  ALV-tunnus, jos käytössä
                  <input value={vatId} onChange={(event) => setVatId(event.target.value)} placeholder="FI12345678" />
                </label>
              </>
            )}
            <label className="checkLine">
              <input
                type="checkbox"
                checked={b2bAccepted}
                onChange={(event) => setB2bAccepted(event.target.checked)}
              />
              <span>Vahvistan, että käytän CheckAppia yrityksenä, yksityisenä elinkeinonharjoittajana tai organisaation edustajana, en kuluttajana yksityiseen käyttöön.</span>
            </label>
            <button className="button primary full" disabled={busy || !canSubmit} onClick={signInWithEmail}>
              {passwordMode === "signin" ? "Kirjaudu sisään" : "Aloita kokeilu"}
            </button>
            <button className="button secondary full" disabled={busy || (passwordMode === "signup" && (!b2bAccepted || !company.companyName || !company.businessId))} onClick={signInWithGoogle}>
              Jatka Googlella
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        </section>

        <section className="section split" id="security">
          <div>
            <p className="eyebrow">Tietoturva</p>
            <h2>Fennoa-kirjautuminen pysyy käyttäjän hallinnassa</h2>
          </div>
          <div className="featureList">
            <div><b>Suora Fennoa-kirjautuminen</b><span>CheckApp ei pyydä eikä tallenna Fennoa-salasanaa. Käyttäjä kirjautuu Fennoaan Fennoan omassa kirjautumisnäkymässä.</span></div>
            <div><b>Käyttäjän kansio</b><span>Kuitit haetaan käyttäjän itse valitsemasta kansiosta.</span></div>
            <div><b>Lisenssitarkistus</b><span>CheckAppin backend tarkistaa trialin, tilauksen ja kuittikiintiön.</span></div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <p className="eyebrow">FAQ</p>
          <h2>Usein kysytyt kysymykset</h2>
          <details><summary>Tarvitaanko maksutiedot kokeilun alussa?</summary><p>Ei. Käyttäjä voi kokeilla 7 päivää ilman maksutietoja tai lisätä maksutavan heti.</p></details>
          <details><summary>Mitä maksutapoja tuetaan?</summary><p>Stripe tukee korttimaksuja ja Apple Payta. MobilePay sopii kertamaksuihin, mutta jatkuvat tilaukset kannattaa hoitaa kortilla tai Apple Paylla. Yrityslasku käsitellään erikseen.</p></details>
          <details><summary>Onko CheckApp Fennoan virallinen sovellus?</summary><p>Ei. CheckApp on ART-HAUSin tarjoama itsenäinen työkalu Fennoa-käyttäjille.</p></details>
        </section>
      </main>
    </>
  );
}

function Header() {
  return (
    <header className="siteHeader">
      <BrandLogo href="#" />
      <nav>
        <a href="#pricing">Hinnat</a>
        <a href="#signup">Rekisteröinti</a>
        <a href="#security">Tietoturva</a>
        <a href="/dashboard">Oma tili</a>
      </nav>
    </header>
  );
}
