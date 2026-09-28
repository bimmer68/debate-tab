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
