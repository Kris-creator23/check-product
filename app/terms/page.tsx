import { BrandLogo } from "../components/BrandLogo";
import { siteContent } from "../../lib/siteContent";

export default function TermsPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">Käyttöehdot</p>
      <h1>CheckAppin käyttöehdot</h1>
      <p>Viimeksi päivitetty: 6. heinäkuuta 2026</p>
      <h2>1. Palvelu</h2>
      <p>CheckApp auttaa yrityksiä, toiminimiä ja taloushallinnon käyttäjiä automatisoimaan kuittien lataamista Fennoaan. CheckApp on itsenäinen tuote eikä Fennoan virallinen sovellus.</p>
      <p>CheckApp on ART-HAUSin tarjoama itsenäinen työkalu Fennoa-käyttäjille. CheckApp ei ole Fennoan virallinen sovellus eikä Fennoan ylläpitämä tai hyväksymä tuote.</p>
      <h2>2. Ehtojen hyväksyminen</h2>
      <p>Luomalla tilin, aloittamalla kokeilun, lisäämällä maksutavan tai käyttämällä CheckAppia asiakas hyväksyy nämä ehdot. CheckApp on tarkoitettu vain yrityksille, yksityisille elinkeinonharjoittajille ja organisaatioiden edustajille, ei kuluttajakäyttöön.</p>
      <h2>3. Kokeilu ja tilaukset</h2>
      <p>Kokeilu kestää 7 päivää. Basic sisältää 50 kuittia kuukaudessa, Pro 100 kuittia ja Premium 500 kuittia. Maksut käsitellään Stripen kautta, ja yrityslaskutus voidaan sopia erikseen.</p>
      <h2>4. Kuittien tunnistus</h2>
      <p>CheckApp käyttää OpenAI API:a kuittitietojen tunnistamiseen. Tunnistus voi sisältää esimerkiksi toimittajan nimen, maa- ja yritystiedot, lasku- tai kuittinumeron, päivämäärät, summat, arvonlisäveron, valuutan ja muistiinpanokentän.</p>
      <h2>5. Automaatio Fennoassa</h2>
      <p>CheckApp käyttää käyttäjän Fennoa-tiliä ja voi täyttää sekä tallentaa kuitin tiedot Fennoaan automaattisesti. CheckApp ei lupaa kirjanpidollista tai verotuksellista oikeellisuutta. Käyttäjä vastaa Fennoa-tilinsä käyttöoikeuksista, kirjanpitoaineiston oikeellisuudesta ja automaattisesti tallennettujen tietojen tarkistamisesta Fennoassa.</p>
      <h2>6. Fennoa-tunnukset</h2>
      <p>Fennoa-salasana tallennetaan käyttäjän laitteelle järjestelmän suojattuun tallennukseen, kuten macOS Keychainiin. Käyttäjä vastaa siitä, että hänellä on oikeus käyttää Fennoa-tiliä automaation kanssa.</p>
      <h2>7. Yhteys</h2>
      <p>Tuotteeseen liittyvissä kysymyksissä ota yhteyttä: {siteContent.supportEmail}. Yritysosoite: {siteContent.businessAddress}.</p>
    </main>
  );
}
