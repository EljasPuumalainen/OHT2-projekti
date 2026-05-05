# OHT2-projekti
Ohjelmistotuotanto 2 kurssin projekti: Pohjapiirrossovellus

Pohjapiirros sovellus joka pyörii Node moottorilla

npm install (riippuvuuksien lataus)

npx vite (paikallinen servu päälle)


Ohje/kontrollit:

Katselutila:

-Kaikki kontrollit on lukittu poislukien kameran säätö.

-2D/3D näkymän vaihto tapahtuu vasemman yläkulman napista.

-2D Näkymässä kameran liikutus joko hiiren oikea (mouse2) pohjassa tai CTRL + hiiren vasen (mouse1).

-3D näkymässä kameran pyöritys hiiren vasen (mouse1) ja kameran liikutus joko hiiren oikea (mouse2) pohjassa tai CTRL + hiiren vasen (mouse1).

-Molemmissa näkymissä zoomaus toimii rullasta.


Siirtelytila: (Mouse1, Mouse2)

-Toimii sekä 2D, että 3D näkymässä.

-Seinän/objektin raahaus hiiren vasemmalla (mouse1) raahaten.

-Seinän/objektin kulman muutos hiiren oikealla (mouse2) raahaten.

-Kameran liikutus samalla tavalla, kuin katselutilassa, kun hiiri ei osu seinään/objektiin


Piirtotila: (Mouse1, Mouse2)
-Näkymä lukittu 2D.

-Kameran liikutus samalla tavalla, kuin katselutilassa (2D).

-Piirto hiiren vasemmalla (mouse1) raahaten.


Ovi/Ikkuna: (Mouse1)

-Oven tai ikkunan voi lisätä piirrettyyn seinään viemällä hiiren haluamaansa kohtaan ja klikkaamalla.

-Klikkaamalla jo luodusta ikkunasta/ovesta -> muuttuu takaisin seinäksi.


Suorakaide/Sylinteri:

-Suorakaiteen ja sylinterin voi lisätä niihin tehdyistä napeista.

-Molemmilla voi antaa haluamansa arvot ja nimen.

-Nimi ei ole pakollinen.


Portaat:

-Portaat napista saa lisättyä haluamansa kokoiset portaat haluamillaan arvoilla.


Hissi:

-Hissi napista saa lisättyä haluamansa kokoisen hissin.


Pohjakuva:

-Ohjelmaan voi ladata valmiin pohjakuvan, jonka avulla voi piirtää rakennuksen.

-Kalibroi mittakaava: 1. Klikkaa ensimmäinen piste pohjakuvalta (esim. rakennuksen nurkka) 2. Klikkaa toinen piste. 3. Anna pisteiden välin oikea etäisyys metreinä. 4. Paina käytä.

-Tämän jälkeen pohjakuvaa voi liikutella piirtoalustalla.

-Pohjakuvan voi lukita paikalleen Lukitse napista ja myös poistaa lukituksen.

-Kuvan läpinäkyvyyttä ja mittoja voi muuttaa.

-Tarttumalla pohjakuvaan siirtelytilassa pohjakuvan asetukset tulevat takaisin esiin.

-Pohjakuvan poistaminen onnistuu DELETE näppäimellä.


Liikuta kaikkia:

-Liikuta kaikkia nappi aktivoi kaikki luodut objektit, jonka jälkeen niitä kaikkia voi raahata.


Delete: (DELETE)

-Objektien poisto toimii klikkaamalla tai valitsemalla objektin ja painamalla DELETE näppäintä.


Valintatyökalu: (CTRL + Mouse1)

-Valintatyökalu toimii siirtelytilassa näppäin yhdistelmällä CTRL + Mouse1.

-Työkalulla voi valita haluamansa objektin ja siirrellä niitä tai poistaa ne DELETE näppäimellä.


Undo: (CTRL + Z)

-UNDO toiminto toimii näppäin yhdistelmällä CTRL + Z.

-Piirto- ikkuna/ovitilassa myös kumoanäppäin oikeassa yläkulmassa.


Copy/Paste: (CTRL + C, CTRL + V)

-Valitun objektin voi kopioida näppäinyhdistemällä CTRL + C ja liittää CTRL + V.

-Toimii myös jos useampi objekti on valittuna.


Lataa/Tallenna: (Vasen yläkulma)

-Tallenna napista pohjapiirroksen voi tallentaa tietokoneellesi. Toimii myös näppäinyhdistelmällä (CTRL + S).

-Lataa napista voit ladata ohjelmaan aikaisemmin luodun piirroksen.
