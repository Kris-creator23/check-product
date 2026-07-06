import { BrandLogo } from "../components/BrandLogo";
import { siteContent } from "../../lib/siteContent";

export default function CookiesPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">Evästeet</p>
      <h1>Evästeet ja tarpeelliset teknologiat</h1>
      <p>Viimeksi päivitetty: 6. heinäkuuta 2026</p>
      <h2>1. Tarpeelliset teknologiat</h2>
      <p>CheckApp käyttää palvelun toiminnan kannalta tarpeellisia kirjautumis-, istunto-, turvallisuus- ja maksuihin liittyviä teknologioita. Näitä tarvitaan esimerkiksi käyttäjätilin, kokeilujakson, tilauksen ja Stripe-maksuprosessin toteuttamiseen.</p>
      <h2>2. Ei markkinointiseurantaa launch-vaiheessa</h2>
      <p>Launch-vaiheessa CheckAppissa ei ole käytössä Google Analyticsia, Meta Pixeliä, PostHogia, Sentryä tai muita ei-välttämättömiä analytiikka- tai markkinointityökaluja.</p>
      <h2>3. Muutokset myöhemmin</h2>
      <p>Jos myöhemmin otetaan käyttöön analytiikkaa, markkinointipikseleitä tai muita ei-välttämättömiä teknologioita, ne otetaan käyttöön vasta asianmukaisen suostumusratkaisun kanssa.</p>
      <h2>4. Yhteys</h2>
      <p>Kysymykset: {siteContent.supportEmail}.</p>
    </main>
  );
}

