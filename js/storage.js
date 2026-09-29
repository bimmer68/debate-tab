// Spremanje turnira u browser (localStorage) i backup u JSON fajl.
// Cijeli turnir je jedan objekat: postavke, klubovi, timovi, sudije i runde.
// Izvoz/uvoz automatski obuhvata sve.

var KLJUC_TURNIRA = 'debateTab.turnir';
var VERZIJA_PODATAKA = 1;

// Pretpostavka: najviše 10 preliminarnih rundi (dovoljno za 16 timova).
var NAJMANJE_RUNDI = 1;
var NAJVISE_RUNDI = 10;

function zadanePostavke() {
  return {
    naziv: '',
    format: 'wsdc',
    brojRundi: 4,
    // Broj govornika po timu u WSDC-u (1, 3 ili 4). Ostali formati ga ne koriste.
    velicinaTima: Formati.wsdc.brojGovornika,
    rasponi: zadaniRasponi('wsdc')
  };
}

function noviTurnir() {
  return {
    verzija: VERZIJA_PODATAKA,
    postavke: zadanePostavke(),
    klubovi: [],
    timovi: [],
    sudije: [],
    runde: []
  };
}

// Učitaj turnir iz browsera. Ako ga nema ili je oštećen, vrati novi.
function ucitajTurnir() {
  try {
    var tekst = localStorage.getItem(KLJUC_TURNIRA);
    if (tekst) {
      return dopuniTurnir(JSON.parse(tekst));
    }
  } catch (e) {
    // Oštećeni podaci ili zabranjen localStorage: nastavljamo sa novim turnirom.
  }
  return noviTurnir();
}

// Vraća true ako je spremanje uspjelo.
function sacuvajTurnir(turnir) {
  try {
    localStorage.setItem(KLJUC_TURNIRA, JSON.stringify(turnir));
    return true;
  } catch (e) {
    return false;
  }
}

// Popuni polja koja nedostaju zadanim vrijednostima,
// da stariji ili ručno uređeni fajlovi i dalje rade.
function dopuniTurnir(podaci) {
  var turnir = noviTurnir();
  if (!podaci || typeof podaci !== 'object') {
    return turnir;
  }
  // Zadrži sve ostale dijelove turnira (npr. timove iz kasnijih faza).
  for (var kljuc in podaci) {
    if (kljuc !== 'postavke') {
      turnir[kljuc] = podaci[kljuc];
    }
  }

  var p = podaci.postavke || {};
  var postavke = turnir.postavke;
  if (typeof p.naziv === 'string') {
    postavke.naziv = p.naziv;
  }
  if (Formati[p.format]) {
    postavke.format = p.format;
  }
  if (Number.isInteger(p.brojRundi) && p.brojRundi >= NAJMANJE_RUNDI && p.brojRundi <= NAJVISE_RUNDI) {
    postavke.brojRundi = p.brojRundi;
  }
  if (Formati.wsdc.velicineTima.indexOf(p.velicinaTima) !== -1) {
    postavke.velicinaTima = p.velicinaTima;
  }
  postavke.rasponi = zadaniRasponi(postavke.format);
  var spremljeni = p.rasponi || {};
  for (var r in postavke.rasponi) {
    var s = spremljeni[r];
    if (s && typeof s.min === 'number' && typeof s.max === 'number' && s.min < s.max) {
      postavke.rasponi[r] = { min: s.min, max: s.max };
    }
  }

  // Klubovi, timovi i sudije: zadrži samo ispravne (vidi js/participants.js).
  var ucesnici = ocistiUcesnike(podaci);
  turnir.klubovi = ucesnici.klubovi;
  turnir.timovi = ucesnici.timovi;
  turnir.sudije = ucesnici.sudije;
  // Runde: zadrži samo ispravne (vidi js/rounds.js).
  turnir.runde = ocistiRunde(podaci);

  turnir.verzija = VERZIJA_PODATAKA;
  return turnir;
}

// Preuzmi turnir kao JSON fajl (backup).
function izveziTurnir(turnir) {
  var tekst = JSON.stringify(turnir, null, 2);
  var fajl = new Blob([tekst], { type: 'application/json' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(fajl);
  link.download = nazivFajla(turnir.postavke.naziv);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// "Kup Sarajeva 2026" -> "turnir-kup-sarajeva-2026.json"
function nazivFajla(naziv) {
  var slova = { 'č': 'c', 'ć': 'c', 'đ': 'dj', 'š': 's', 'ž': 'z' };
  var dio = naziv.toLowerCase()
    .replace(/[čćđšž]/g, function (s) { return slova[s]; })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return 'turnir' + (dio ? '-' + dio : '') + '.json';
}

// Pročitaj izabrani JSON fajl. Kad završi, pozove gotovo(greska, turnir).
function procitajFajlTurnira(fajl, gotovo) {
  var citac = new FileReader();
  citac.onload = function () {
    var podaci;
    try {
      podaci = JSON.parse(citac.result);
    } catch (e) {
      gotovo('Fajl nije ispravan JSON.');
      return;
    }
    if (!podaci || typeof podaci !== 'object' || !podaci.postavke) {
      gotovo('Ovaj fajl ne izgleda kao backup turnira iz Debate Tab-a.');
      return;
    }
    gotovo(null, dopuniTurnir(podaci));
  };
  citac.onerror = function () {
    gotovo('Fajl se ne može pročitati.');
  };
  citac.readAsText(fajl);
}
