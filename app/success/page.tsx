export default function SuccessPage() {
  return (
    <main className="accountPage">
      <section className="accountCard">
        <p className="eyebrow">Maksutapa lisätty</p>
        <h1>Check on valmis käyttöön</h1>
        <p>Ensimmäiset 7 päivää ovat maksuttomat. Voit ladata Mac-sovelluksen ja jatkaa käyttöönottoa.</p>
        <a className="button primary" href="/api/download">Lataa Check Macille</a>
        <a className="button secondary" href="/dashboard">Oma tili</a>
      </section>
    </main>
  );
}
