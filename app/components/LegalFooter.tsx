import { siteContent } from "../../lib/siteContent";

export function LegalFooter() {
  return (
    <footer className="footer">
      <span>© 2026 CheckApp / {siteContent.providerName}</span>
      <p>CheckApp on ART-HAUSin tarjoama itsenäinen työkalu Fennoa-käyttäjille. CheckApp ei ole Fennoan virallinen sovellus eikä Fennoan ylläpitämä tai hyväksymä tuote.</p>
      <div>
        <a href="/terms">Käyttöehdot</a>
        <a href="/privacy">Tietosuojaseloste</a>
        <a href="/cookies">Evästeet</a>
        <a href="/subprocessors">Alihankkijat</a>
        <a href="/dpa">DPA</a>
      </div>
    </footer>
  );
}

