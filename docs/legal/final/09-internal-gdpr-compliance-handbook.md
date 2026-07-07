# INTERNAL GDPR COMPLIANCE HANDBOOK

Päivitetty: 7.7.2026

Tämä dokumentti on ART-HAUSin sisäinen CheckApp-compliance-muistio.

## 1. Data flow

Kuitti valitusta paikallisesta kansiosta -> CheckApp backend proxy -> OpenAI API `store: false` -> tunnistettu JSON -> Mac-sovellus -> Fennoa-kenttien täyttö käyttäjän Fennoa-istunnossa.

## 2. Ei saa lokittaa

Tuotantolokeihin ei saa kirjoittaa:

- kuvan Base64-sisältöä;
- kuittikuvaa;
- raakaa OpenAI-vastausta;
- toimittajan nimeä;
- Y-tunnusta tai ALV-numeroa;
- summia;
- päivämääriä;
- Fennoa-salasanaa;
- Fennoa 2FA -koodia.

## 3. Saa lokittaa teknisesti

Sallittuja ovat tekniset tiedot kuten aikaleima, sisäinen käyttäjätunniste, onnistuminen/virhekategoria, latenssi, HTTP-status ja käyttömäärä, jos ne eivät paljasta kuitin sisältöä.

## 4. Avaimet

OpenAI API key saa olla vain server-side environment variable -muuttujissa. Avainta ei saa sisällyttää Mac-sovellukseen, ZIP-tiedostoihin, DMG-tiedostoihin, README-esimerkkeihin tai asiakaspuolen koodiin.

Jos avaimen epäillään vuotaneen, se tulee mitätöidä ja korvata uudella production-avaimella.

## 5. Fennoa

Nykyinen Mac-sovellus ei pyydä eikä tallenna Fennoa-salasanaa. Käyttäjä kirjautuu Fennoaan suoraan Fennoan kirjautumisnäkymässä.

## 6. Launch riskit

Ennen laajaa julkista launchia:

- varmista OpenAI key rotation;
- varmista Vercel logging/retention;
- varmista onnistunut ja epäonnistunut kuittitesti;
- varmista inactive subscription ja quota exceeded -testit;
- notarize Mac DMG Apple Developer ID:llä.
