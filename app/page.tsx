"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "../lib/supabase";
import { plans, type PlanId } from "../lib/plans";

type AuthMode = "password" | "magic";

export default function HomePage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<PlanId>("pro");
  const [authMode, setAuthMode] = useState<AuthMode>("magic");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signInWithGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard?plan=${plan}`
      }
    });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  async function signInWithEmail() {
    setBusy(true);
    setMessage("");

    if (authMode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?plan=${plan}`
        }
      });
      setMessage(error ? error.message : "Tarkista sähköpostisi. Lähetimme kirjautumislinkin.");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?plan=${plan}`
        }
      });
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
              Check hakee kuitit valitusta kansiosta, kirjautuu Fennoaan, lataa tiedostot,
              täyttää tarvittavat kentät ja tallentaa ne kirjanpitoon. Kokeilu alkaa ilman
              maksua, ja tilaus jatkuu vain valitulla paketilla.
            </p>
            <div className="actions">
              <a className="button primary" href="#signup">Aloita 7 päivän kokeilu</a>
              <a className="button secondary" href="#pricing">Katso hinnat</a>
            </div>
            <div className="stats">
              <div><strong>7 pv</strong><span>maksuton kokeilu</span></div>
              <div><strong>50-500</strong><span>kuittia kuukaudessa</span></div>
              <div><strong>Mac</strong><span>paikallinen sovellus</span></div>
            </div>
          </div>

          <div className="window" aria-label="Check-sovelluksen esikatselu">
            <div className="windowBar"><span /><span /><span /></div>
            <div className="appPanel">
              <div className="status ok"><span /><div><b>Fennoa yhdistetty</b><p>Tunnukset säilytetään macOS Keychainissa</p></div></div>
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
            Check poistaa toistuvan työn: kuittien etsimisen, Fennoan avaamisen,
            tiedostojen lataamisen, kenttien täyttämisen ja tallentamisen.
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
                <div className="price"><strong>{item.price}</strong><span>/ kk</span></div>
                <ul>
                  <li>Enintään {item.quota} kuittia kuukaudessa</li>
                  <li>7 päivän maksuton kokeilu</li>
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
              Voit aloittaa ilman maksutietoja ja valita maksutavan myöhemmin. Voit myös
              lisätä maksutavan heti: ensimmäiset 7 päivää ovat silti ilmaiset.
            </p>
          </div>
          <div className="signupBox">
            <label>
              Paketti
              <select value={plan} onChange={(event) => setPlan(event.target.value as PlanId)}>
                {Object.values(plans).map((item) => <option value={item.id} key={item.id}>{item.name} - {item.price}/kk</option>)}
              </select>
            </label>
            <div className="tabs">
              <button className={authMode === "magic" ? "selected" : ""} onClick={() => setAuthMode("magic")}>Sähköpostilinkki</button>
              <button className={authMode === "password" ? "selected" : ""} onClick={() => setAuthMode("password")}>Salasana</button>
            </div>
            <label>
              Sähköposti
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.fi" type="email" />
            </label>
            {authMode === "password" && (
              <label>
                Salasana
                <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Vähintään 8 merkkiä" type="password" />
              </label>
            )}
            <button className="button primary full" disabled={busy || !email} onClick={signInWithEmail}>
              Aloita kokeilu
            </button>
            <button className="button secondary full" disabled={busy} onClick={signInWithGoogle}>
              Jatka Googlella
            </button>
            {message && <p className="message">{message}</p>}
          </div>
        </section>

        <section className="section split" id="security">
          <div>
            <p className="eyebrow">Tietoturva</p>
            <h2>Fennoa-tunnukset eivät kuulu koodiin</h2>
          </div>
          <div className="featureList">
            <div><b>macOS Keychain</b><span>Fennoa-salasana säilytetään Macin avainnipussa.</span></div>
            <div><b>Paikallinen käsittely</b><span>Kuitit haetaan käyttäjän valitsemasta kansiosta.</span></div>
            <div><b>Lisenssitarkistus</b><span>Sovellus tarkistaa trialin ja tilauksen backendistä.</span></div>
          </div>
        </section>

        <section className="section faq" id="faq">
          <p className="eyebrow">FAQ</p>
          <h2>Usein kysytyt kysymykset</h2>
          <details><summary>Tarvitaanko maksutiedot kokeilun alussa?</summary><p>Ei. Käyttäjä voi kokeilla 7 päivää ilman maksutietoja tai lisätä maksutavan heti.</p></details>
          <details><summary>Mitä maksutapoja tuetaan?</summary><p>Stripe tukee korttimaksuja ja Apple Payta. MobilePay sopii kertamaksuihin, mutta jatkuvat tilaukset kannattaa hoitaa kortilla tai Apple Paylla. Yrityslasku käsitellään erikseen.</p></details>
          <details><summary>Onko Check Fennoan virallinen sovellus?</summary><p>Ei. Check on itsenäinen tuote, joka automatisoi toistuvaa työtä Fennoassa.</p></details>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="siteHeader">
      <a className="brand" href="#"><span>C</span>Check</a>
      <nav>
        <a href="#pricing">Hinnat</a>
        <a href="#signup">Rekisteröinti</a>
        <a href="#security">Tietoturva</a>
        <a href="/dashboard">Oma tili</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span>© 2026 Check</span>
      <div><a href="/privacy">Tietosuojaseloste</a><a href="/terms">Käyttöehdot</a></div>
    </footer>
  );
}
