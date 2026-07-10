# CheckApp Mac-sovellus

CheckApp auttaa lataamaan kuitteja Fennoaan ja täyttämään kuittitietoja automaattisesti.
CheckApp on ART-HAUSin tarjoama itsenäinen työkalu Fennoa-käyttäjille. Se ei ole Fennoan virallinen sovellus eikä Fennoan ylläpitämä tai hyväksymä tuote.

## Ennen käyttöä

Tarvitset:

- aktiivisen CheckApp-tilin;
- Fennoa-käyttäjätunnuksen;
- Mac-tietokoneen;
- kansion, jossa käsiteltävät kuitit ovat.

Tuetut tiedostot:

- PDF;
- JPG / JPEG;
- PNG.

PDF-tiedostoista tunnistetaan tällä hetkellä ensimmäinen sivu.

## Käynnistäminen

1. Avaa `CheckApp.app`.
2. Kirjaudu CheckApp-tilillesi sähköpostiin lähetettävällä koodilla.
3. Anna kuittikansion polku, kun sovellus pyytää sitä.
4. Kirjaudu Fennoaan sovelluksen avaamassa selainikkunassa.
5. Syötä Fennoan 2FA-koodi Fennoan omassa kirjautumisnäkymässä, jos Fennoa pyytää sitä.

Jos macOS varoittaa ensimmäisellä avauskerralla, se johtuu siitä, että CheckApp on ladattu verkkosivulta eikä App Storesta. Avaa sovellus Finderissa näin: ctrl-klikkaa CheckAppia, valitse Avaa ja vahvista Avaa.

## Kuittien käsittely

CheckApp hakee kuitit valitsemastasi kansiosta ja lataa ne Fennoaan käyttäen omaa Fennoa-tiliäsi.
Kuittikuvan visuaalinen sisältö lähetetään CheckAppin palvelimen kautta OpenAI API -palveluun tietojen tunnistamista varten.
Tunnistuksen perusteella CheckApp täyttää Fennoan kenttiä ja voi tallentaa kuitin Fennoaan automaattisesti.

Automaattinen tunnistus voi tehdä virheitä. Tarkista aina tiedot Fennoassa ennen niiden käyttämistä kirjanpidossa, verotuksessa tai maksamisessa.

## Fennoa-tunnukset ja 2FA

Fennoa-sähköposti ja salasana tallennetaan vain laitteellesi järjestelmän suojattuun tallennukseen, kuten macOS Keychainiin.
Fennoa-salasanaa ei lähetetä CheckAppin palvelimelle.
Fennoan 2FA-koodi syötetään Fennoan omassa kirjautumisnäkymässä. CheckApp ei tallenna 2FA-koodia eikä lähetä sitä CheckAppin palvelimelle.

## Käsitellyt tiedostot

Onnistuneesti käsitellyt tiedostot siirretään paikalliseen `Documents/CheckApp/processed`-kansioon.
Epäonnistuneet tiedostot siirretään paikalliseen `Documents/CheckApp/failed`-kansioon.
Käyttäjä vastaa paikallisten kuittitiedostojen säilyttämisestä, arkistoinnista ja poistamisesta.

## Tilaus ja käyttömäärä

Sovellus tarkistaa CheckApp-tilauksen ja kuittikiintiön ennen käsittelyä.
Jokaisesta onnistuneesti tallennetusta kuitista kirjataan yksi käyttökerta CheckApp-palveluun.
Käyttökertaa kirjattaessa CheckApp-palveluun ei lähetetä kuitin alkuperäistä tiedostoa tai tunnistettuja kuittikenttiä.
OpenAI API -avainta ei tarvita eikä tallenneta Mac-sovellukseen.

## Tuki

Jos tarvitset apua, ota yhteyttä CheckApp-tukeen:

`[TIETOSUOJA- JA TUKISÄHKÖPOSTI]`
