export default function CancelPage() {
  return (
    <main className="accountPage">
      <section className="accountCard">
        <p className="eyebrow">Maksua ei viimeistelty</p>
        <h1>Voit jatkaa kokeilua ilman maksutietoja</h1>
        <p>Maksutavan voi lisätä myöhemmin ennen kokeilun päättymistä.</p>
        <a className="button primary" href="/dashboard">Palaa omalle tilille</a>
      </section>
    </main>
  );
}
