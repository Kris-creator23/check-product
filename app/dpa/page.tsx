import { BrandLogo } from "../components/BrandLogo";
import { siteContent } from "../../lib/siteContent";

export default function DpaPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">DPA</p>
      <h1>Henkilötietojen käsittelysopimus</h1>
      <p>Viimeksi päivitetty: 7. heinäkuuta 2026</p>
      <h2>1. Roolit</h2>
      <p>Receipt data -käsittelyssä B2B-asiakas toimii rekisterinpitäjänä ja ART-HAUS toimii henkilötietojen käsittelijänä CheckApp-palvelun tuottamisessa. OpenAI ja muut palveluntarjoajat voivat toimia alikäsittelijöinä.</p>
      <h2>2. Käsittelyn tarkoitus</h2>
      <p>Käsittelyn tarkoitus on kuittien lataaminen Fennoaan, kuittitietojen tunnistaminen, käyttäjän tilauksen ja kuittikiintiön tarkistaminen sekä palvelun tarjoaminen yritysasiakkaille ja toiminimille.</p>
      <h2>3. Kuittikuvien käsittely</h2>
      <p>CheckApp käsittelee Asiakkaan kuittikuvaa väliaikaisesti backend-välityspalvelussa ainoastaan tietojen tunnistamisen toteuttamiseksi ja OpenAI API -palveluun välittämiseksi. CheckAppin backend-palvelua ei ole tarkoitettu kuittikuvien, Base64-sisällön, OpenAI:n raakavastausten tai tunnistettujen kirjanpitokenttien pysyvään säilyttämiseen.</p>
      <p>Käsittelyn jälkeen Mac-sovellus käyttää tunnistettuja tietoja Fennoan kenttien täyttämiseen paikallisen selainautomaation avulla käyttäjän Fennoa-istunnossa. Käyttömäärän laskentaa varten backend-palveluun lähetetään onnistuneen käsittelyn jälkeen vain minimimäärä käyttötietoa.</p>
      <p>Fennoa-salasanaa tai Fennoan 2FA-koodia ei lähetetä CheckAppin backend-palveluun eikä OpenAI API -palveluun. Käyttäjä kirjautuu Fennoaan Fennoan omassa kirjautumisnäkymässä.</p>
      <h2>4. Dokumentti ennen sopimusta</h2>
      <p>Tämä sivu on launch-vaiheen yhteenveto. Varsinainen henkilötietojen käsittelysopimus tai sopimusliite voidaan toimittaa asiakkaalle erikseen pyynnöstä.</p>
      <h2>5. Yhteys</h2>
      <p>DPA-pyynnöt: {siteContent.supportEmail}. Yritysosoite: {siteContent.businessAddress}.</p>
    </main>
  );
}
