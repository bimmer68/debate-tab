# Učenje uz projekat

Ovdje se skupljaju pojmovi koji se pojave u svakoj fazi, sa kratkim objašnjenjem i primjerom iz ovog projekta.

---

## Faza 1: Kostur

### HTML
Jezik kojim se opisuje **šta** je na stranici: naslovi, linkovi, dugmad, tekst. Sastoji se od "tagova" u šiljastim zagradama `< >`.
Primjer iz `index.html`:
```html
<a href="#/timovi">Timovi</a>
```
Ovo je link (`<a>`) sa tekstom "Timovi".

### CSS
Jezik kojim se opisuje **kako** stranica izgleda: boje, veličine, razmaci. Nalazi se u `css/style.css`.
Primjer:
```css
.logo {
  font-weight: 700;
}
```
Sve što ima klasu `logo` bit će napisano podebljano.

### Klasa (CSS klasa)
Ime koje dajemo HTML elementu da bismo ga u CSS-u ili JavaScriptu mogli pronaći. Jedan element može imati više klasa.
Primjer: `<nav class="navigacija">` – u CSS-u ga pronalazimo sa `.navigacija`.

### CSS varijabla
Vrijednost (npr. boja) koja se definiše jednom i koristi na više mjesta. Ako promijenimo boju na jednom mjestu, promijeni se svuda.
Primjer iz `css/style.css`:
```css
:root { --boja-glavna: #1f4e79; }
.zaglavlje { background: var(--boja-glavna); }
```

### Responzivni dizajn i `@media`
Stranica se prilagođava veličini ekrana (laptop ili mobitel). `@media (max-width: 600px)` znači: "ova pravila važe samo kad je ekran uži od 600 piksela".
Primjer: na mobitelu dugmad u navigaciji zauzimaju cijeli red i ravnomjerno se rašire.

### JavaScript
Programski jezik koji stranicu čini "živom": reaguje na klikove, mijenja sadržaj, računa. Nalazi se u folderu `js/`.

### Varijabla
"Kutija" sa imenom u koju spremimo neku vrijednost da je kasnije koristimo.
Primjer iz `js/router.js`:
```js
var kljuc = trenutnaStranica();
```
U kutiju `kljuc` spremamo ime trenutne stranice, npr. `"timovi"`.

### Funkcija
Imenovani komad koda koji radi jedan posao. Napiše se jednom, a pozove koliko god puta treba.
Primjer iz `js/pages.js`:
```js
function plocica(kljuc, naslov, opis) { ... }
```
Ova funkcija pravi jednu karticu na početnoj stranici. Pozivamo je pet puta, za svaku sekciju.

### Parametar
Podatak koji funkciji predamo kad je pozovemo. U primjeru iznad, `kljuc`, `naslov` i `opis` su parametri.
Poziv: `plocica('timovi', 'Timovi', 'Klubovi, timovi i govornici.')`.

### Objekat
Skup imenovanih vrijednosti na jednom mjestu. Kao ormar sa ladicama, gdje svaka ladica ima naziv.
Primjer: `Stranice` u `js/pages.js` je objekat u kojem je svaka "ladica" jedna stranica (`pocetna`, `postavke`, `timovi`...).

### DOM
Način na koji JavaScript "vidi" HTML stranicu: kao drvo elemenata koje može čitati i mijenjati.
Primjer iz `js/router.js`:
```js
document.getElementById('sadrzaj').innerHTML = stranica();
```
Pronađi element sa id-jem `sadrzaj` i zamijeni mu sadržaj.

### Event listener (osluškivač događaja)
Kod koji "čeka" da se nešto desi (klik, promjena adrese...) i onda pokrene funkciju.
Primjer iz `js/app.js`:
```js
window.addEventListener('hashchange', prikaziStranicu);
```
Kad se promijeni dio adrese iza `#`, pokreni funkciju `prikaziStranicu`.

### Hash (dio adrese iza `#`) i hash navigacija
Sve što je u adresi iza znaka `#` browser ne šalje serveru, nego ostaje u stranici. Koristimo to da znamo koju stranicu prikazati, a da se `index.html` ne učitava ponovo.
Primjer: `index.html#/sudije` prikazuje stranicu Sudije.
Zašto ovako: radi i kad se fajl otvori direktno sa diska i na GitHub Pages, bez posebnog servera.

### Skripta (`<script>`)
Tag u HTML-u koji učitava JavaScript fajl. Fajlovi se učitavaju redom, pa je redoslijed bitan: `pages.js` mora biti prije `router.js`, jer router koristi `Stranice`.
Napomena: namjerno ne koristimo "module" (`type="module"`), jer oni ne rade kad se `index.html` otvori direktno iz fajla.

### GitHub Pages
Besplatno objavljivanje web stranice direktno iz GitHub repozitorija. Aplikacija je samo skup fajlova (HTML, CSS, JS), pa ih GitHub Pages može odmah prikazati.
Fajl `.nojekyll` (prazan) govori GitHub Pages-u da fajlove prikaže tačno onakve kakvi jesu, bez dodatne obrade.

### Pull request (PR)
Prijedlog izmjena. Programer napravi izmjene na zasebnoj grani (branch), a vlasnik ih pregleda i, ako mu odgovaraju, spoji (merge) u glavnu verziju.

---

## Faza 2: Postavke turnira

### localStorage
Mali "ormar" u browseru u koji stranica može spremiti tekst, i koji ostaje i kad se browser zatvori. Svaki podatak ima svoj ključ (ime).
Primjer iz `js/storage.js`:
```js
localStorage.setItem('debateTab.turnir', JSON.stringify(turnir));
```
Važno: podaci su samo u **tom** browseru na **tom** računaru. Zato postoji izvoz u fajl (backup).

### JSON
Način da se objekat zapiše kao običan tekst, pa se može spremiti ili poslati. `JSON.stringify` pretvara objekat u tekst, a `JSON.parse` tekst nazad u objekat.
Primjer: backup turnira izgleda ovako:
```json
{ "verzija": 1, "postavke": { "naziv": "Kup Sarajeva", "format": "bp", "brojRundi": 5 } }
```

### Izvoz i uvoz (backup)
**Izvoz** pravi JSON fajl od cijelog turnira i nudi ga za preuzimanje (`izveziTurnir` u `js/storage.js`).
**Uvoz** čita takav fajl i njime zamijeni trenutni turnir (`procitajFajlTurnira`). Prije zamjene aplikacija pita za potvrdu.

### Forma (`<form>`) i polja
Forma je skup polja koja korisnik popunjava: `<input>` (tekst ili broj), `<select>` (padajući meni) i `<button>`.
Primjer iz `js/settings.js`: polje `naziv`, meni `format`, broj `brojRundi` i dugme "Sačuvaj postavke".

### `preventDefault()`
Kad se forma pošalje, browser bi inače ponovo učitao stranicu. `dogadjaj.preventDefault()` kaže: "nemoj to raditi, ja ću sam obraditi podatke".

### Provjera unosa (validacija)
Prije spremanja provjeravamo da su podaci smisleni: naziv nije prazan, broj rundi je od 1 do 10, "od" je manje od "do".
Primjer: funkcija `provjeriPostavke` u `js/settings.js` vraća tekst greške, ili prazan tekst ako je sve u redu.

### `if` (uslov)
Kod koji se izvrši samo ako je nešto tačno.
```js
if (p.naziv === '') {
  return 'Upiši naziv turnira.';
}
```

### Petlja `for ... in`
Prolazi kroz sve "ladice" jednog objekta. Koristimo je da napravimo polja za svaki raspon bodova (WSDC ima dva: glavni govor i replika, BP samo jedan).
```js
for (var kljuc in format.rasponi) { ... }
```

### `try` / `catch`
"Pokušaj ovo, a ako pukne, uradi ono." Koristimo ga oko `localStorage` i `JSON.parse`, jer spremanje može biti zabranjeno, a fajl može biti oštećen. Aplikacija tada ne prestane raditi, nego pokaže poruku.

### Callback (funkcija koja se pozove kasnije)
Čitanje fajla traje malo vremena, pa `procitajFajlTurnira(fajl, gotovo)` dobije funkciju `gotovo` koju pozove kad završi, sa greškom ili sa pročitanim turnirom.

### Siguran HTML (escaping)
Tekst koji upiše korisnik ne smije se ubaciti u stranicu "sirov", jer bi `<` i `>` browser shvatio kao HTML. Funkcija `sigurnoHtml` u `js/utils.js` ih pretvara u bezopasne znakove (`&lt;`, `&gt;`).

### Zadane vrijednosti (default)
Vrijednosti koje se koriste dok korisnik ne unese svoje. Primjer: `js/formats.js` kaže da je zadani raspon za BP 50–100. Funkcija `dopuniTurnir` popunjava sve što nedostaje zadanim vrijednostima, pa i stariji backup fajlovi rade.

### `data-` atribut i tema
HTML elementu možemo dodati svoj podatak, npr. `<html data-tema="svijetla">`. CSS onda kaže: "ako je tema svijetla, koristi ove boje":
```css
:root[data-tema="svijetla"] { --boja-pozadina: #f4f6f9; }
```
Pošto su sve boje CSS varijable, dovoljno je promijeniti varijable i cijela aplikacija promijeni izgled. Izbor teme pamtimo u `localStorage` (`js/theme.js`).

### CSS Grid
Način da se elementi poslože u kolone i redove. Na stranici Postavke kartice su na mobitelu jedna ispod druge (`1fr`), a na laptopu jedna pored druge (`1fr 1fr`):
```css
@media (min-width: 900px) {
  .mreza-postavki { grid-template-columns: 1fr 1fr; }
}
```

---

## Popravka: provjera bodova i kucanje brojeva (Postavke)

### Bug (greška u programu) i uzrok
Bug je kad program radi drugačije nego što treba. Kod popravke je važno naći **uzrok**, a ne samo sakriti posljedicu.
Primjer: polja za bodove se nisu mogla kucati. Posljedica je "ne mogu kucati", a uzrok je bio preusko polje u kojem su strelice gore/dole zauzele mjesto za cifre.

### `type="number"` naspram `type="text"` + `inputmode="numeric"`
`<input type="number">` je polje za broj sa strelicama gore/dole, a vrijednost mijenja i točkić miša. U uskom polju strelice pojedu mjesto za cifre.
Zato polja za bodove sada koriste običan tekst, a `inputmode="numeric"` kaže mobitelu da otvori tastaturu sa brojevima. Da je upisan ispravan broj provjeravamo sami.
Primjer iz `js/settings.js`:
```js
'<input type="text" inputmode="numeric" name="glavni-min" ...>'
```

### Regularni izraz (regex)
Kratak "šablon" kojim se provjerava izgled teksta. `/^[0-9]+$/` znači: "od početka (`^`) do kraja (`$`) samo cifre, barem jedna (`+`)".
Primjer iz `js/settings.js`: `"14"` prolazi, a `""`, `"-5"`, `"7,5"` i `"abc"` ne prolaze.

### Zašto `Number('')` nije dovoljan
`Number('')` daje `0`, a ne grešku. Zato bi prazno polje tiho postalo nula. Prvo provjeravamo tekst (funkcija `greskaBroja`), a tek onda ga pretvaramo u broj.

### Greška pored polja i `aria-invalid`
Svako polje ima ispod sebe prazno mjesto (`<span class="greska-polja">`) u koje upišemo grešku baš za to polje. Atribut `aria-invalid="true"` oboji okvir polja crveno i čitaču ekrana kaže da polje nije ispravno, a `aria-describedby` mu pročita tekst greške.
Funkcija `prikaziGreske` u `js/settings.js` radi oboje i stavi kursor u prvo neispravno polje.

### Događaj `input`
Pokrene se svaki put kad korisnik promijeni sadržaj nekog polja. Koristimo ga da sklonimo staru poruku "Postavke su sačuvane." čim korisnik počne mijenjati polja, da ne izgleda kao da su nove vrijednosti već snimljene.

---

## Keš i upozorenje o standardnom rasponu

### ⚠️ Pravilo: kad nešto ne radi nakon objave, prvo testiraj u incognito prozoru
Incognito (privatni) prozor ne koristi keš ni spremljene podatke iz običnog prozora. Ako u njemu radi, a u običnom ne, problem je keš u tvom browseru, a ne kod.
Otvara se sa Ctrl+Shift+N (Chrome, Edge) ili Ctrl+Shift+P (Firefox).
Primjer iz ovog projekta: nakon popravke Postavki polja su u običnom prozoru i dalje imala strelice, a u incognito prozoru su radila ispravno.

### Keš (cache)
Browser pamti kopije fajlova (CSS, JS, slike) da ih ne mora svaki put ponovo preuzimati. Zato ponekad, nakon nove objave, i dalje koristi stari fajl.

### Broj verzije u adresi fajla (`?v=4`)
Dio adrese iza `?` server ne gleda, ali browser ga gleda: `settings.js?v=4` i `settings.js?v=5` su za njega dva različita fajla. Kad povećamo broj, browser mora preuzeti novu kopiju.
Primjer iz `index.html`:
```html
<script src="js/settings.js?v=4"></script>
```
Pravilo: kad se promijeni bilo koji CSS ili JS fajl, broj se poveća svuda u `index.html`.

### Prozor za potvrdu (`<dialog>`)
HTML element za mali prozor iznad stranice. `showModal()` ga otvori i "zaključa" ostatak stranice dok korisnik ne odgovori.
Primjer iz `js/settings.js`: kad raspon odstupa od standarda, `pitajZaOdstupanje` otvori prozor sa dugmadima **Sačuvaj** i **Odustani**. Dugmad su u `<form method="dialog">`, pa klik zatvori prozor i zapamti koje je dugme kliknuto (`returnValue`). Tipka Esc znači isto što i Odustani.

### Upozorenje naspram greške
**Greška** blokira: npr. "od" veće od "do" se ne može snimiti. **Upozorenje** samo pita: raspon 50–80 za WSDC nije standardan, ali je dozvoljen ako tab direktor to potvrdi.
