export default function CancelPage() {
  return (
    <main className="accountPage">
      <section className="accountCard">
        <p className="eyebrow">Maksua ei viimeistelty</p>
        <h1>Tilauksen aloitus jäi kesken</h1>
        <p>Kokeilu alkaa, kun maksutapa on lisätty Stripe Checkoutissa. Korttia ei veloiteta 7 päivän kokeilun aikana, ja tilauksen voi perua milloin tahansa.</p>
        <a className="button primary" href="/dashboard">Palaa omalle tilille</a>
      </section>
    </main>
  );
}
