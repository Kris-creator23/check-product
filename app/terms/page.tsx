import { BrandLogo } from "../components/BrandLogo";
import { siteContent } from "../../lib/siteContent";

export default function TermsPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">Käyttöehdot</p>
      <h1>CheckAppin käyttöehdot</h1>
      <p>Viimeksi päivitetty: 12. heinäkuuta 2026</p>
      <h2>1. Palvelu</h2>
      <p>CheckApp auttaa yrityksiä, toiminimiä ja taloushallinnon käyttäjiä automatisoimaan kuittien lataamista Fennoaan. CheckApp on itsenäinen tuote eikä Fennoan virallinen sovellus.</p>
      <p>CheckApp on ART-HAUSin tarjoama itsenäinen työkalu Fennoa-käyttäjille. CheckApp ei ole Fennoan virallinen sovellus eikä Fennoan ylläpitämä tai hyväksymä tuote.</p>
      <h2>2. Ehtojen hyväksyminen</h2>
      <p>Luomalla tilin, aloittamalla kokeilun, lisäämällä maksutavan tai käyttämällä CheckAppia asiakas hyväksyy nämä ehdot. CheckApp on tarkoitettu vain yrityksille, yksityisille elinkeinonharjoittajille ja organisaatioiden edustajille, ei kuluttajakäyttöön.</p>
      <h2>3. Kokeilu ja tilaukset</h2>
      <p>Kokeilu kestää 7 päivää ja edellyttää maksutavan lisäämistä Stripe Checkoutissa. Maksua ei veloiteta kokeilun alussa. Tilaus jatkuu kokeilun jälkeen maksullisena, ellei sitä peruta ennen Checkoutissa ja omalla tilillä ilmoitettua kokeilun päättymisaikaa. Tilauksen voi perua milloin tahansa Stripe Customer Portalissa. Basic sisältää 50 kuittia kuukaudessa, Pro 100 kuittia ja Premium 500 kuittia. Yrityslaskutus voidaan sopia erikseen.</p>
      <h2>4. Kuittien tunnistus</h2>
      <p>CheckApp käyttää OpenAI API:a kuittitietojen tunnistamiseen. Tunnistus voi sisältää esimerkiksi toimittajan nimen, maa- ja yritystiedot, lasku- tai kuittinumeron, päivämäärät, summat, arvonlisäveron, valuutan ja muistiinpanokentän.</p>
      <h2>5. Automaatio Fennoassa</h2>
      <p>CheckApp toimii käyttäjän Fennoa-istunnossa ja voi täyttää kuitin tiedot Fennoaan paikallisen selainautomaation avulla. CheckApp voi ohjata käyttäjää tarkistamaan ja tallentamaan kuitin Fennoassa. CheckApp ei lupaa kirjanpidollista tai verotuksellista oikeellisuutta. Käyttäjä vastaa Fennoa-tilinsä käyttöoikeuksista, kirjanpitoaineiston oikeellisuudesta ja tietojen tarkistamisesta Fennoassa.</p>
      <h2>6. Fennoa-tunnukset</h2>
      <p>CheckApp ei pyydä eikä tallenna Fennoa-salasanaa. Käyttäjä kirjautuu Fennoaan suoraan Fennoan omassa kirjautumisnäkymässä ja syöttää mahdollisen 2FA-koodin suoraan Fennoaan. Käyttäjä vastaa siitä, että hänellä on oikeus käyttää Fennoa-tiliä automaation kanssa.</p>
      <h2>7. Yhteys</h2>
      <p>Tuotteeseen liittyvissä kysymyksissä ota yhteyttä: {siteContent.supportEmail}. Yritysosoite: {siteContent.businessAddress}.</p>
    </main>
  );
}
