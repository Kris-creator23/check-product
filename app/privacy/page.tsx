import { BrandLogo } from "../components/BrandLogo";

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">Tietosuojaseloste</p>
      <h1>Checkin tietosuojaseloste</h1>
      <p>Viimeksi päivitetty: 4. heinäkuuta 2026</p>
      <h2>1. Mitä tietoja käytämme</h2>
      <p>Check voi käyttää tilitietoja, Fennoa-kirjautumistietoja, kuittikansion polkua, käsittelylokia, maksutietojen tilaa ja teknisiä virheilmoituksia.</p>
      <h2>2. Missä tiedot säilytetään</h2>
      <p>Fennoa-salasana säilytetään macOS Keychainissa. Käyttäjätilit ja tilauksen tila säilytetään Supabasessa. Maksut käsitellään Stripen kautta.</p>
      <h2>3. Maksut</h2>
      <p>Stripe käsittelee kortti- ja Apple Pay -maksut. Yrityslaskut käsitellään erikseen. Check ei tallenna korttinumeroita omalle palvelimelle.</p>
      <h2>4. Yhteys</h2>
      <p>Tietosuojaan liittyvissä kysymyksissä ota yhteyttä: arthausfi@gmail.com.</p>
    </main>
  );
}
