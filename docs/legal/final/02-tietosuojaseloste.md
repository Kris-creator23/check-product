# TIETOSUOJASELOSTE

Päivitetty: 7.7.2026

## 1. Rekisterinpitäjä

ART-HAUS, Y-tunnus 3491623-6  
Suvilahdenkatu 4, 00500 Helsinki, Finland  
checkappfi@gmail.com

## 2. Käsiteltävät tiedot

CheckApp voi käsitellä käyttäjätiliin, kirjautumiseen, tilaukseen, kokeilujaksoon, maksutilaan, kuittikiintiöön ja käyttömäärään liittyviä tietoja.

Mac-sovellus voi tallentaa paikallisesti käyttäjän Macille CheckApp-istunnon, valitun kuittikansion polun ja tiedon AI-käsittelyn hyväksynnästä.

## 3. Kuittien käsittely

Mac-sovellus hakee kuitit käyttäjän valitsemasta kansiosta ja lataa kuitin Fennoaan käyttäjän Fennoa-istunnossa.

Kuitin visuaalinen sisältö lähetetään CheckAppin suojatun backend-välityspalvelun kautta OpenAI API -palveluun tietojen tunnistamista varten. ART-HAUS ei käytä CheckAppin backend-palvelua kuittikuvien tai tunnistettujen kirjanpitokenttien pysyvään tallentamiseen. Backend-palvelu käsittelee kuittikuvan teknisesti ja väliaikaisesti tunnistustoiminnon toteuttamiseksi.

OpenAI API -pyynnöissä käytetään tuotantokäytössä asetusta `store: false`. ART-HAUS tarkistaa lisäksi Zero Data Retention -asetuksen saatavuuden ja ottaa sen käyttöön, jos se on ART-HAUSin palvelutilille saatavilla ja teknisesti soveltuva.

## 4. Fennoa-tunnukset ja 2FA

Fennoa-käyttäjätunnusta, Fennoa-salasanaa tai kaksivaiheisen tunnistautumisen koodia ei lähetetä CheckAppin tunnistusrajapintaan eikä OpenAI API -palveluun.

CheckApp ei pyydä eikä tallenna Fennoa-salasanaa. Käyttäjä kirjautuu Fennoaan suoraan Fennoan omassa kirjautumisnäkymässä. Mahdollinen 2FA-koodi syötetään käyttäjän toimesta suoraan Fennoaan.

## 5. CheckApp-kirjautuminen

Mac-sovelluksen ensisijainen kirjautumistapa on sähköpostikoodi. Jos käyttäjä on rekisteröitynyt Googlella, hän käyttää Mac-sovelluksessa samaa Google-sähköpostiosoitetta ja saa kertakäyttöisen kirjautumiskoodin sähköpostiinsa. CheckApp ei pyydä Google-salasanaa.

Jos sähköpostikoodin lähetys ei onnistu ja käyttäjällä on CheckApp-salasana, sovellus voi tarjota CheckApp-salasanakirjautumisen varavaihtoehtona.

## 6. Paikalliset tiedostot ja lokit

Onnistuneen käsittelyn jälkeen Mac-sovellus siirtää paikallisen kuittitiedoston käyttäjän laitteella kansioon `~/Documents/CheckApp/processed`. Virhetilanteessa tiedosto siirretään kansioon `~/Documents/CheckApp/failed`.

Mac-sovellus voi kirjoittaa teknisen lokin tiedostoon `~/Library/Logs/CheckApp.log`. Loki on tarkoitettu tekniseen vianmääritykseen eikä sitä ole tarkoitettu kuittien sisällön pysyvään tallentamiseen.

## 7. Palveluntarjoajat

CheckApp voi käyttää palveluntarjoajina muun muassa OpenAI:ta, Stripea, Supabasea, Verceliä, Googlea ja GitHubia.

## 8. Yhteys

Tietosuojaan liittyvät kysymykset: checkappfi@gmail.com
