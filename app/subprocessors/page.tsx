import { BrandLogo } from "../components/BrandLogo";
import { siteContent } from "../../lib/siteContent";

const subprocessors = [
  ["OpenAI", "Kuittitietojen tunnistus ja asiakaspalveluchat, jos chat on käytössä."],
  ["Stripe", "Maksut, tilaukset, laskutukseen liittyvät tiedot ja Customer Portal."],
  ["Supabase", "Käyttäjätunnistus, käyttäjäprofiilit, tilauksen tila ja käyttömäärät."],
  ["Vercel", "Sivuston, backend-reittien ja tuotantoympäristön hosting."],
  ["Google", "Valinnainen Google-kirjautuminen Supabasen kautta."],
  ["GitHub", "Mac-sovelluksen DMG-jakelutiedoston julkaisu ja lataus GitHub Releases -palvelun kautta."]
];

export default function SubprocessorsPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">Alihankkijat</p>
      <h1>CheckAppin alihankkijat</h1>
      <p>Viimeksi päivitetty: 7. heinäkuuta 2026</p>
      <p>CheckApp on ART-HAUSin tarjoama tuote. Alla on launch-vaiheen alihankkijarekisteri. Sovellettavat tietojenkäsittelysopimukset ja palveluntarjoajien ehdot pidetään erikseen tallessa.</p>
      {subprocessors.map(([name, purpose]) => (
        <section key={name}>
          <h2>{name}</h2>
          <p>{purpose}</p>
        </section>
      ))}
      <h2>Yhteys</h2>
      <p>Kysymykset alihankkijoista: {siteContent.supportEmail}.</p>
    </main>
  );
}
