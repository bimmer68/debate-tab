# Debate Tab

Web aplikacija za vođenje debatnih turnira (tab sistem): unos timova i sudija, parovanje po rundama, unos balota, poredak timova i govornika, te break za eliminacije.

Aplikacija je na **bosanskom jeziku**.

---

## Tehnička pravila (obavezno)

- Čisti HTML, CSS i JavaScript, **bez build koraka** i bez frameworka. Aplikacija mora raditi otvaranjem `index.html` i biti objavljena na **GitHub Pages**.
- Podaci se čuvaju u browseru (`localStorage`). Mora postojati **izvoz i uvoz cijelog turnira u JSON fajl** (backup).
- Nema vanjskih biblioteka osim ako nisu zaista potrebne. Ako neku uvedeš, objasni zašto.
- Kod podijeli u male, jasno imenovane fajlove (npr. `js/pairing.js`, `js/tab.js`, `js/storage.js`).
- Radi na laptopu i na mobitelu.
- U `index.html` CSS i JS fajlovi imaju broj verzije (npr. `js/settings.js?v=4`). Kad se promijeni bilo koji CSS ili JS fajl, taj broj se poveća svuda, da browseri ne koriste staru kopiju iz keša.
- Turnir ima najviše **16 timova**, pa performanse nisu problem. Prioritet je jasnoća koda.

## Kako radimo (obavezno za svaki zadatak)

1. Jedan zadatak = jedna faza iz plana ispod. Ne radi ništa izvan zadatka.
2. U opisu pull requesta objasni **na jednostavnom bosanskom** šta si promijenio, zašto, i koji fajl radi šta. Vlasnik projekta nije programer i uči iz svakog PR-a.
3. Ažuriraj `LEARNING.md` novim pojmovima koji su se pojavili u zadatku (npr. "funkcija", "localStorage", "event listener"), sa kratkim objašnjenjem i primjerom iz ovog projekta.
4. Kada neko pravilo nije jasno, napravi razumnu pretpostavku, stavi je u postavke da se može promijeniti i navedi je u opisu PR-a.

---

## Formati

Kod kreiranja turnira bira se format. Rasponi bodova su postavke koje se mogu mijenjati.

### World Schools (WSDC)
- 2 tima (Propozicija i Opozicija).
- **Veličina tima je postavka turnira:** 1, 3 ili 4 govornika po timu (1v1, 3v3, 4v4). Bira se jednom za cijeli turnir. Zadano je 3.
- Tim ima tačno onoliko članova koliko govori, bez rezervi.
- Govori: svaki govornik drži jedan glavni govor + replika po timu.
- Replika postoji u svim varijantama. U 1v1 je drži jedini govornik. U 3v3 i 4v4 drži je bilo koji govornik osim zadnjeg.
- Redoslijed: P1, O1, P2, O2... pa replika Opozicije, pa replika Propozicije.
- Bodovi: glavni govor 60–80, replika 30–40.
- Ako već postoje timovi sa drugim brojem govornika, veličina tima se ne može promijeniti dok se ti timovi ne urede ili obrišu.
- Panel sudija (neparan broj). Pobjeđuje tim za koji glasa većina sudija.
- Poredak timova: pobjede → broj sudijskih glasova (ballots) → ukupni bodovi govornika.

### British Parliamentary (BP)
- 4 tima: Otvaranje Vlade (OG), Otvaranje Opozicije (OO), Zatvaranje Vlade (CG), Zatvaranje Opozicije (CO), po 2 govornika.
- Sudije rangiraju timove 1–4. Bodovi timovima: 1. mjesto = 3, 2. = 2, 3. = 1, 4. = 0.
- Bodovi govornika: 50–100.
- Poredak timova: timski bodovi → ukupni bodovi govornika.
- Kroz runde svaki tim treba što ravnomjernije proći sve četiri pozicije.

### Karl Popper
- 2 tima (Afirmacija i Negacija), po 3 govornika.
- Redoslijed: A1, (unakrsno ispitivanje), N1, (unakrsno ispitivanje), A2, N2, A3, N3.
- Bodovi govornika: 1–30.
- Nema replike.
- Poredak timova: pobjede → ballots → ukupni bodovi govornika.

## Zajednička pravila

- Svaki tim pripada klubu/školi. Timovi iz istog kluba se **ne sparuju** međusobno ako se to može izbjeći.
- Sudija ne smije suditi timu iz svog kluba (konflikt). Aplikacija upozorava na konflikt.
- Ista dva tima se ne sreću dvaput ako se može izbjeći.
- Strane (propozicija/opozicija) se kroz runde balansiraju.
- **Runda 1:** nasumično parovanje uz poštivanje pravila o klubovima.
- **Runde 2+:** power pairing, tj. timovi sa sličnim rezultatom idu jedni protiv drugih.
- Ako broj timova ne odgovara formatu (neparan za WSDC/KP, nije djeljiv sa 4 za BP), aplikacija nudi dodavanje **swing tima** (tim sastavljen od rezervnih govornika, ne ulazi u poredak).
- **Standardni rasponi bodova:** svaki format ima standardni raspon (WSDC: glavni govor 60–80, replika 30–40; BP: 50–100; Karl Popper: 1–30). Ako tab direktor unese raspon koji odstupa od standarda, aplikacija prikaže upozorenje "Raspon odstupa od standarda za [format] ([raspon]). Sačuvati svejedno?" sa dugmadima **Sačuvaj** / **Odustani**. Ne blokira, samo upozorava.
- **Break:** vlasnik bira koliko timova ide u eliminacije (npr. 4 ili 8). Aplikacija pravi eliminacijski ždrijeb po poretku.

### Pravila za balote (svi formati)

- Pobjednik se ne bira posebno. Aplikacija ga izračuna iz bodova: pobjeđuje tim sa više ukupnih bodova na tom balotu.
- **Neriješeno nije dozvoljeno.** Ako su ukupni bodovi timova jednaki, balot se ne može sačuvati, uz poruku da sudija mora odlučiti i promijeniti bodove.
- **BP:** poredak 1–4 izračunava se iz ukupnih bodova timova. Dva tima sa istim zbirom na istom balotu nisu dozvoljena.
- Bodovi su cijeli brojevi, unutar raspona iz Postavki. Van raspona balot se ne može sačuvati.
- **Panel:** svaki sudija ima svoj balot. Tim pobjeđuje u sobi ako dobije većinu balota. Bod govornika u rundi je prosjek bodova svih sudija u toj sobi.
- **WSDC:** na balotu se bira koji govornik drži repliku. U 1v1 to je jedini govornik, u 3v3 i 4v4 bilo ko osim zadnjeg.

### Kako radi unos balota

- Balote se unose samo za objavljene runde.
- Za svaku sobu vidi se status: "nije uneseno" / "uneseno".
- Unesen balot može se urediti.
- Govorni redoslijed na formi prati format.
- Swing tim se boduje normalno na balotu, ali ne ulazi u poredak.

---

## Plan po fazama

Svaka faza je jedna cloud sesija i jedan pull request.

1. **Kostur**: početna stranica, navigacija (Postavke, Timovi, Sudije, Runde, Tab), osnovni izgled, spremno za GitHub Pages. Kreiraj i `LEARNING.md`.
2. **Postavke turnira**: naziv, format, broj preliminarnih rundi, rasponi bodova. Snimanje u `localStorage`, izvoz/uvoz JSON-a.
3. **Unos učesnika**: klubovi, timovi sa govornicima, sudije sa klubom. Dodavanje, uređivanje, brisanje.
4. **Parovanje runde 1**: nasumično uz pravila; ručna izmjena parova; dodjela sudija uz upozorenje na konflikte.
5. **Unos balota**: forma prilagođena formatu, sa provjerom da su bodovi u rasponu i da se bodovi slažu sa pobjednikom.
6. **Tab**: poredak timova i poredak govornika, po pravilima formata.
7. **Power pairing** za runde 2+: izbjegavanje ponovljenih susreta i balans strana/pozicija.
8. **Break i eliminacije**.
9. **Štampa i dijeljenje**: pregled parova i rezultata pogodan za projektor i štampu.

**Kasnije (nije dio prve verzije):** sudije same unose balote preko svog linka. To traži bazu podataka na serveru i planira se tek kad faze 1–9 rade.
