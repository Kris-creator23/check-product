import { BrandLogo } from "../components/BrandLogo";
import { siteContent } from "../../lib/siteContent";

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <BrandLogo />
      <p className="eyebrow">Tietosuojaseloste</p>
      <h1>CheckAppin tietosuojaseloste</h1>
      <p>Viimeksi päivitetty: 7. heinäkuuta 2026</p>
      <h2>1. Mitä tietoja käytämme</h2>
      <p>CheckApp voi käyttää tilitietoja, kirjautumis- ja tilaustietoja, kuittikansion polkua, kuittien käyttömäärää, maksutietojen tilaa, paikallisia teknisiä lokitietoja ja teknisiä virheilmoituksia.</p>
      <p>Palvelun tarjoaja on ART-HAUS. Verkkotunnus: {siteContent.domain}. Yritysosoite: {siteContent.businessAddress}.</p>
      <h2>2. Kuittien käsittely</h2>
      <p>Mac-sovellus hakee kuitit käyttäjän valitsemasta kansiosta ja lataa kuitin Fennoaan käyttäjän Fennoa-istunnossa. Käyttäjä kirjautuu Fennoaan suoraan Fennoan omassa kirjautumisnäkymässä.</p>
      <p>Kuitin visuaalinen sisältö lähetetään CheckAppin suojatun backend-välityspalvelun kautta OpenAI API -palveluun tietojen tunnistamista varten. ART-HAUS ei käytä CheckAppin backend-palvelua kuittikuvien tai tunnistettujen kirjanpitokenttien pysyvään tallentamiseen. Backend-palvelu käsittelee kuittikuvan teknisesti ja väliaikaisesti tunnistustoiminnon toteuttamiseksi.</p>
      <p>Onnistuneen käsittelyn jälkeen Mac-sovellus siirtää paikallisen tiedoston käyttäjän laitteella <code>~/Documents/CheckApp/processed</code>-kansioon ja virhetilanteessa <code>~/Documents/CheckApp/failed</code>-kansioon.</p>
      <h2>3. OpenAI</h2>
      <p>OpenAI käsittelee kuittikuvan kuittitietojen tunnistamista varten. OpenAI API -pyynnöissä käytetään tuotantokäytössä asetusta <code>store: false</code>. ART-HAUS tarkistaa lisäksi Zero Data Retention -asetuksen saatavuuden ja ottaa sen käyttöön, jos se on ART-HAUSin palvelutilille saatavilla ja teknisesti soveltuva.</p>
      <h2>4. Fennoa-tunnukset ja 2FA</h2>
      <p>Fennoa-käyttäjätunnusta, Fennoa-salasanaa tai kaksivaiheisen tunnistautumisen koodia ei lähetetä CheckAppin tunnistusrajapintaan. CheckApp ei pyydä eikä tallenna Fennoa-salasanaa. Mahdollinen 2FA-koodi syötetään käyttäjän toimesta suoraan Fennoan kirjautumisprosessiin.</p>
      <h2>5. Missä tiedot säilytetään</h2>
      <p>Käyttäjätilit, lisenssin tila, valittu paketti ja kuittien käyttömäärä säilytetään Supabasessa. Mac-sovellus voi tallentaa CheckApp-kirjautumisistunnon, valitun kuittikansion ja AI-käsittelyn hyväksynnän paikallisesti käyttäjän Macille. Sivusto ja backend toimivat Vercelissä. Maksut käsitellään Stripen kautta. Asiakaspalveluchat voi käyttää OpenAI API:a.</p>
      <p>Mac-sovelluksen tekninen loki voidaan kirjoittaa käyttäjän laitteelle tiedostoon <code>~/Library/Logs/CheckApp.log</code>. Loki on tarkoitettu tekniseen vianmääritykseen eikä sitä ole tarkoitettu kuittien sisällön pysyvään tallentamiseen.</p>
      <h2>6. Maksut</h2>
      <p>Stripe käsittelee kortti- ja Apple Pay -maksut. Yrityslaskut käsitellään erikseen. CheckApp ei tallenna korttinumeroita omalle palvelimelle.</p>
      <h2>7. Evästeet ja vastaavat teknologiat</h2>
      <p>Launch-vaiheessa CheckApp käyttää vain palvelun toiminnan kannalta tarpeellisia kirjautumis-, istunto- ja maksuihin liittyviä teknologioita. Jos myöhemmin otetaan käyttöön analytiikkaa, markkinointipikseleitä tai muita ei-välttämättömiä teknologioita, ne otetaan käyttöön vasta asianmukaisen suostumusratkaisun kanssa.</p>
      <h2>8. Alikäsittelijät ja tietoturvapoikkeamat</h2>
      <p>CheckApp voi käyttää palveluntarjoajina esimerkiksi OpenAI:ta, Stripea, Supabasea, Verceliä, Googlea ja GitHubia. Sovellettavat tietojenkäsittelysopimukset pidetään voimassa ja alikäsittelijälista ajantasaisena. Mahdolliset tietoturvapoikkeamat arvioidaan tapauskohtaisesti ja tarvittaessa käsitellään GDPR:n 72 tunnin ilmoitusmenettelyn mukaisesti.</p>
      <h2>9. Yhteys</h2>
      <p>Tietosuojaan liittyvissä kysymyksissä ota yhteyttä: {siteContent.supportEmail}.</p>
    </main>
  );
}
