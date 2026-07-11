export default function SuccessPage() {
  return (
    <main className="accountPage">
      <section className="accountCard">
        <p className="eyebrow">Maksutapa lisätty</p>
        <h1>CheckApp on valmis käyttöön</h1>
        <p>Jos yrityksellä on oikeus uuteen kokeiluun, ensimmäiset 7 päivää ovat maksuttomat. Sen jälkeen tilaus jatkuu maksullisena valitulla paketilla, ellei sitä peruta. Jos kokeilu on jo käytetty, maksullinen tilaus alkaa heti.</p>
        <p>Voit hallita tai perua tilauksen milloin tahansa omalta tililtä Stripe Customer Portalissa.</p>
        <p>Mac voi ensimmäisellä avauskerralla varoittaa, koska CheckApp ladataan verkkosivulta eikä App Storesta. Avaa sovellus tarvittaessa Finderissa: ctrl-klikkaa CheckAppia, valitse Avaa ja vahvista Avaa.</p>
        <a className="button primary" href="/api/download">Lataa CheckApp Macille</a>
        <a className="button secondary" href="/dashboard">Oma tili</a>
      </section>
    </main>
  );
}
