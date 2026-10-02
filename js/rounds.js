// Runde: podaci i pravila (nacrt, objava, ručne zamjene, swing timovi).
// Računanje parova je u pairing.js, a izgled stranice u rounds-page.js.
//
// U turniru runda izgleda ovako:
//   runde: [{
//     broj: 1,
//     status: 'nacrt',          // 'nacrt' ili 'objavljena'
//     velicinaPanela: 3,        // 1, 3 ili 5 sudija po sobi
//     sobe: [
//       { timovi: ['t3', 't1'], sudije: ['s2', 's5', 's1'] },   // timovi po pozicijama
//       ...                                                      // + rezultat (sudijski listići), vidi ballots.js
//     ]
//   }]
// Sudije koje nisu ni u jednoj sobi su "slobodne" i ne pamte se posebno.

var VELICINE_PANELA = [1, 3, 5];
var ZADANI_PANEL = 1;

// Pretpostavka: najmanje 2 prava tima (bez swing timova) za parovanje.
var NAJMANJE_PRAVIH_TIMOVA = 2;

function timovaPoSobi(turnir) {
  return Formati[turnir.postavke.format].timovaPoSobi;
}

function pozicije(turnir) {
  return Formati[turnir.postavke.format].pozicije;
}

function nadjiRundu(turnir, broj) {
  for (var i = 0; i < turnir.runde.length; i++) {
    if (turnir.runde[i].broj === broj) {
      return turnir.runde[i];
    }
  }
  return null;
}

// Pravi timovi (bez swing timova) i swing timovi.
function praviTimovi(turnir) {
  return turnir.timovi.filter(function (t) { return !t.swing; });
}

function swingTimovi(turnir) {
  return turnir.timovi.filter(function (t) { return t.swing; });
}

// ---- Swing timovi ----
// Swing tim popunjava mjesto kad broj timova ne odgovara formatu.
// Nema klub, govornici se zovu "Swing 1", "Swing 2"... i ne ulazi u poredak.

// Koliko swing timova treba da ukupan broj bude djeljiv sa brojem timova po sobi.
// Npr. WSDC sa 7 timova: 1; BP sa 13 timova: 3; BP sa 16 timova: 0.
function potrebnoSwingTimova(turnir) {
  var poSobi = timovaPoSobi(turnir);
  var ostatak = praviTimovi(turnir).length % poSobi;
  return ostatak === 0 ? 0 : poSobi - ostatak;
}

// Da li je ukupan broj timova (sa swing timovima) spreman za parovanje.
function brojTimovaOdgovara(turnir) {
  return praviTimovi(turnir).length >= NAJMANJE_PRAVIH_TIMOVA &&
    turnir.timovi.length % timovaPoSobi(turnir) === 0;
}

// Dodaj ili ukloni swing timove, tako da ih bude tačno onoliko koliko treba.
function uskladiSwingTimove(turnir) {
  var potrebno = potrebnoSwingTimova(turnir);
  var postojeci = swingTimovi(turnir);
  // Uklanjaju se zadnji dodani, da ostali zadrže svoja imena.
  for (var i = postojeci.length - 1; i >= potrebno; i--) {
    turnir.timovi = ukloniPoId(turnir.timovi, postojeci[i].id);
  }
  for (var j = postojeci.length; j < potrebno; j++) {
    var tim = { id: noviId('t', turnir.timovi), naziv: '', klubId: '', govornici: [], swing: true };
    turnir.timovi.push(tim);
  }
  imenujSwingTimove(turnir);
}

// Swing timovi se zovu "Swing A", "Swing B"..., a govornici su numerisani redom
// kroz sve swing timove: "Swing 1", "Swing 2", "Swing 3"...
// Poziva se i kad se u postavkama promijeni veličina tima.
function imenujSwingTimove(turnir) {
  var broj = brojGovornika(turnir);
  var sljedeci = 1;
  swingTimovi(turnir).forEach(function (tim, redni) {
    tim.naziv = 'Swing ' + 'ABCDEFGHIJKLMNOP'.charAt(redni);
    var govornici = [];
    for (var i = 0; i < broj; i++) {
      var stari = tim.govornici[i];
      govornici.push({
        id: stari ? stari.id : noviId('g', sviGovornici(turnir).concat(govornici)),
        ime: 'Swing ' + sljedeci++
      });
    }
    tim.govornici = govornici;
  });
}

// ---- Pravljenje nacrta ----

// Najveći panel (5, 3 ili 1) za koji ima dovoljno sudija u svim sobama.
// Vraća 0 ako nema sudija ni za po jednog u svakoj sobi.
function najveciMoguciPanel(brojSudija, brojSoba) {
  for (var i = VELICINE_PANELA.length - 1; i >= 0; i--) {
    if (VELICINE_PANELA[i] * brojSoba <= brojSudija) {
      return VELICINE_PANELA[i];
    }
  }
  return 0;
}

// Napravi (ili ponovo napravi) nacrt runde 1.
// Poziva se tek kad brojTimovaOdgovara(turnir) vrati true.
function generisiRundu1(turnir, velicinaPanela) {
  var sobe = napraviSobe(turnir.timovi, timovaPoSobi(turnir)).map(function (timovi) {
    return { timovi: timovi, sudije: [] };
  });
  var runda = { broj: 1, status: 'nacrt', velicinaPanela: velicinaPanela, sobe: sobe };
  dodijeliSudijeRundi(turnir, runda);
  turnir.runde = turnir.runde.filter(function (r) { return r.broj !== 1; });
  turnir.runde.push(runda);
  return runda;
}

// Ponovo dodijeli sve sudije (npr. kad se promijeni veličina panela). Timovi ostaju.
function dodijeliSudijeRundi(turnir, runda) {
  var sobe = runda.sobe.map(function (soba) {
    return soba.timovi.map(function (id) { return nadjiPoId(turnir.timovi, id) || { id: id, klubId: '' }; });
  });
  var paneli = dodijeliSudije(sobe, turnir.sudije, runda.velicinaPanela);
  runda.sobe.forEach(function (soba, i) {
    soba.sudije = paneli[i];
  });
}

// ---- Ručne izmjene nacrta ----

// Gdje se nalazi tim ili sudija: { soba: indeks, mjesto: indeks } ili null (slobodan sudija).
function nadjiMjesto(runda, vrsta, id) {
  for (var s = 0; s < runda.sobe.length; s++) {
    var mjesto = runda.sobe[s][vrsta].indexOf(id);
    if (mjesto !== -1) {
      return { soba: s, mjesto: mjesto };
    }
  }
  return null;
}

// Zamijeni mjesta dva tima (i iz iste sobe: tada zamijene strane).
function zamijeniTimove(runda, idA, idB) {
  var a = nadjiMjesto(runda, 'timovi', idA);
  var b = nadjiMjesto(runda, 'timovi', idB);
  if (!a || !b) {
    return;
  }
  runda.sobe[a.soba].timovi[a.mjesto] = idB;
  runda.sobe[b.soba].timovi[b.mjesto] = idA;
}

// Zamijeni mjesta dva sudije. Jedan od njih može biti slobodan (nije ni u jednoj sobi):
// tada slobodni ulazi u sobu, a onaj iz sobe postaje slobodan.
function zamijeniSudije(runda, idA, idB) {
  var a = nadjiMjesto(runda, 'sudije', idA);
  var b = nadjiMjesto(runda, 'sudije', idB);
  if (a) {
    runda.sobe[a.soba].sudije[a.mjesto] = idB;
  }
  if (b) {
    runda.sobe[b.soba].sudije[b.mjesto] = idA;
  }
}

// Dodaj slobodnog sudiju u sobu kojoj nedostaje sudija za pun panel.
// Vraća true ako je dodan.
function dodajSudijuUSobu(runda, id, indeksSobe) {
  var soba = runda.sobe[indeksSobe];
  if (!soba || nadjiMjesto(runda, 'sudije', id) || soba.sudije.length >= runda.velicinaPanela) {
    return false;
  }
  soba.sudije.push(id);
  return true;
}

// Izvadi sudiju iz sobe: postaje slobodan. Vraća indeks sobe iz koje je izašao, ili -1.
function oslobodiSudiju(runda, id) {
  var mjesto = nadjiMjesto(runda, 'sudije', id);
  if (!mjesto) {
    return -1;
  }
  runda.sobe[mjesto.soba].sudije.splice(mjesto.mjesto, 1);
  return mjesto.soba;
}

// Da li sobi nedostaje sudija za pun panel.
function sobaTrebaSudiju(runda, soba) {
  return soba.sudije.length < runda.velicinaPanela;
}

// Sudije koje nisu ni u jednoj sobi.
function slobodneSudije(turnir, runda) {
  return turnir.sudije.filter(function (s) { return !nadjiMjesto(runda, 'sudije', s.id); });
}

// ---- Provjere ----

// Crvene oznake jedne sobe: parovi timova iz istog kluba i sudije sa konfliktom.
// Vraća { istiKlub: ['Gimnazija Mostar'], konflikti: ['s2', ...] }.
function oznakeSobe(turnir, soba) {
  var timovi = soba.timovi.map(function (id) { return nadjiPoId(turnir.timovi, id); })
    .filter(function (t) { return t; });
  var istiKlubovi = [];
  for (var i = 0; i < timovi.length; i++) {
    for (var j = i + 1; j < timovi.length; j++) {
      var klub = nazivKluba(turnir, timovi[i].klubId);
      if (istiKlub(timovi[i].klubId, timovi[j].klubId) && istiKlubovi.indexOf(klub) === -1) {
        istiKlubovi.push(klub);
      }
    }
  }
  var konflikti = soba.sudije.filter(function (id) {
    var sudija = nadjiPoId(turnir.sudije, id);
    return sudija && sudijaImaKonflikt(sudija, timovi);
  });
  return { istiKlub: istiKlubovi, konflikti: konflikti };
}

// Ukupan broj crvenih oznaka u rundi.
function brojCrvenihOznaka(turnir, runda) {
  var broj = 0;
  runda.sobe.forEach(function (soba) {
    var oznake = oznakeSobe(turnir, soba);
    broj += oznake.istiKlub.length + oznake.konflikti.length;
  });
  return broj;
}

// Da li nacrt i dalje odgovara timovima i sudijama.
// Ako je nakon pravljenja nacrta neki tim dodan ili obrisan (ili sudija obrisan),
// nacrt treba ponovo generisati. Vraća listu razloga (prazna = sve je u redu).
function razloziZastarjelosti(turnir, runda) {
  var razlozi = [];
  var uRundi = [];
  runda.sobe.forEach(function (soba) {
    uRundi = uRundi.concat(soba.timovi);
    if (soba.timovi.length !== timovaPoSobi(turnir)) {
      razlozi.push('Broj timova u sobi ne odgovara formatu.');
    }
  });
  var obrisanihTimova = uRundi.filter(function (id) { return !nadjiPoId(turnir.timovi, id); }).length;
  var novihTimova = turnir.timovi.filter(function (t) { return uRundi.indexOf(t.id) === -1; }).length;
  var obrisanihSudija = 0;
  runda.sobe.forEach(function (soba) {
    obrisanihSudija += soba.sudije.filter(function (id) { return !nadjiPoId(turnir.sudije, id); }).length;
  });
  if (novihTimova > 0) {
    razlozi.push('Timova dodanih nakon parovanja (nisu u nacrtu): ' + novihTimova + '.');
  }
  if (obrisanihTimova > 0) {
    razlozi.push('Obrisanih timova koji su u nacrtu: ' + obrisanihTimova + '.');
  }
  if (obrisanihSudija > 0) {
    razlozi.push('Obrisanih sudija koji su u nacrtu: ' + obrisanihSudija + '.');
  }
  // Ista poruka o broju timova samo jednom.
  return razlozi.filter(function (r, i) { return razlozi.indexOf(r) === i; });
}

// Šta sprečava objavu runde. Crvene oznake ne sprečavaju objavu (samo se pita).
function preprekeZaObjavu(turnir, runda) {
  var prepreke = razloziZastarjelosti(turnir, runda);
  var nepotpuni = runda.sobe.filter(function (s) { return sobaTrebaSudiju(runda, s); }).length;
  if (nepotpuni > 0) {
    prepreke.push(tekstBroja(nepotpuni, 'soba nema', 'sobe nemaju', 'soba nema') + ' pun panel (' +
      tekstBroja(runda.velicinaPanela, 'sudija', 'sudije', 'sudija') + '). Izaberi manji panel ili dodaj sudije.');
  }
  return prepreke;
}

// Objavljena runda u kojoj učestvuje tim ili sudija (vrsta: 'timovi' ili 'sudije'), ili null.
// Takav tim ili sudija se ne smije obrisati.
function objavljenaRundaSa(turnir, vrsta, id) {
  for (var i = 0; i < turnir.runde.length; i++) {
    var runda = turnir.runde[i];
    if (runda.status === 'objavljena' && nadjiMjesto(runda, vrsta, id)) {
      return runda;
    }
  }
  return null;
}

// ---- Čišćenje podataka ----
// Poziva se kod učitavanja iz browsera i kod uvoza JSON fajla (vidi storage.js).

function ocistiRunde(podaci) {
  var runde = [];
  if (!Array.isArray(podaci.runde)) {
    return runde;
  }
  podaci.runde.forEach(function (r) {
    if (!r || typeof r !== 'object' || !Number.isInteger(r.broj) || r.broj < 1 ||
        !Array.isArray(r.sobe) || nadjiRundu({ runde: runde }, r.broj)) {
      return;
    }
    var objavljena = r.status === 'objavljena';
    var sobe = r.sobe.filter(function (s) {
      return s && Array.isArray(s.timovi) && Array.isArray(s.sudije);
    }).map(function (s) {
      var soba = { timovi: s.timovi.filter(jeTekst), sudije: s.sudije.filter(jeTekst) };
      // Sudijski listići postoje samo u objavljenoj rundi.
      var rezultat = objavljena ? ocistiRezultat(s.rezultat, soba.timovi.length) : null;
      if (rezultat) {
        soba.rezultat = rezultat;
      }
      return soba;
    });
    runde.push({
      broj: r.broj,
      status: objavljena ? 'objavljena' : 'nacrt',
      velicinaPanela: VELICINE_PANELA.indexOf(r.velicinaPanela) !== -1 ? r.velicinaPanela : ZADANI_PANEL,
      sobe: sobe
    });
  });
  return runde;
}
