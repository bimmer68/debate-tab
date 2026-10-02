// Tab: poredak timova i govornika.
// Ovdje je samo računanje. Izgled stranice je u tab-page.js.
//
// Tab računa samo "kompletne" runde: runda je objavljena i svaka njena soba ima
// unesene sudijske listiće svih svojih sudija. Runda kojoj fali makar jedna soba
// ne ulazi u tab, a stranica pokaže koje sobe nedostaju.
//
// Swing timovi i njihovi govornici ne ulaze u poredak. Njihovi protivnici ipak
// normalno dobiju pobjedu (ili poraz) i bodove iz te sobe.

// Kriteriji poretka timova. Koji se koriste i kojim redom piše u formats.js (kriterijiTimova).
var KRITERIJI_TIMOVA = {
  pobjede: 'Pobjede',
  listici: 'Sudijski listići',
  timskiBodovi: 'Timski bodovi',
  bodovi: 'Bodovi govornika'
};

// ---- Koje runde ulaze u tab ----

// Da li soba ima unesene sudijske listiće svih svojih sudija.
function sobaKompletna(soba) {
  if (!soba.rezultat) {
    return false;
  }
  return soba.sudije.every(function (sudijaId) {
    return soba.rezultat.listici.some(function (l) { return l.sudijaId === sudijaId; });
  });
}

// Stanje svih rundi za tab, poredano po broju runde:
//   {
//     uracunate: [runda1, runda2],               // ulaze u tab
//     nepotpune: [{ broj: 3, sobe: [2, 4] }],     // objavljene, ali sobama 2 i 4 fale listići
//     nacrti: [4]                                 // još nisu objavljene
//   }
function stanjeRundi(turnir) {
  var stanje = { uracunate: [], nepotpune: [], nacrti: [] };
  var runde = turnir.runde.slice().sort(function (a, b) { return a.broj - b.broj; });
  runde.forEach(function (runda) {
    if (runda.status !== 'objavljena') {
      stanje.nacrti.push(runda.broj);
      return;
    }
    var nedostaju = [];
    runda.sobe.forEach(function (soba, indeks) {
      if (!sobaKompletna(soba)) {
        nedostaju.push(indeks + 1);
      }
    });
    if (nedostaju.length === 0) {
      stanje.uracunate.push(runda);
    } else {
      stanje.nepotpune.push({ broj: runda.broj, sobe: nedostaju });
    }
  });
  return stanje;
}

// ---- Poredak timova ----

// Statistika svakog pravog tima (bez swing timova) iz uračunatih rundi:
//   { tim: {...}, pobjede: 2, listici: 5, timskiBodovi: 2, bodovi: 431.67 }
//   pobjede:      u koliko soba je tim bio prvi
//   listici:      koliko sudijskih listića je tim dobio (bio prvi na listiću)
//   timskiBodovi: BP: 1. mjesto u sobi = 3, 2. = 2, 3. = 1, 4. = 0
//   bodovi:       zbir bodova govornika tima kroz sve runde (prosjek sudija u svakoj sobi)
function statistikaTimova(turnir, runde) {
  var redovi = praviTimovi(turnir).map(function (tim) {
    return { tim: tim, pobjede: 0, listici: 0, timskiBodovi: 0, bodovi: 0 };
  });
  runde.forEach(function (runda) {
    runda.sobe.forEach(function (soba) {
      var rezultat = rezultatSobe(turnir, soba, soba.rezultat);
      soba.timovi.forEach(function (timId, t) {
        var red = redovi.filter(function (r) { return r.tim.id === timId; })[0];
        if (!red) {
          return; // swing tim
        }
        var mjesto = rezultat.poredak.indexOf(t); // 0 = prvi u sobi
        if (mjesto === 0) {
          red.pobjede++;
        }
        red.listici += rezultat.glasovi[t];
        red.timskiBodovi += soba.timovi.length - 1 - mjesto;
        red.bodovi += bodoviTimaUSobi(turnir, rezultat, t);
      });
    });
  });
  return redovi;
}

// Bodovi govornika jednog tima u jednoj sobi.
// Kod WSDC-a postavka "Ukupni bodovi tima" kaže da li se dodaje i replika.
function bodoviTimaUSobi(turnir, rezultat, t) {
  var saReplikom = turnir.postavke.replikaUBodoveTima;
  var zbir = 0;
  rezultat.govornici.forEach(function (g) {
    if (g.tim === t && (g.vrsta === 'glavni' || saReplikom)) {
      zbir += g.bod;
    }
  });
  return zbir;
}

// Poredak timova po kriterijima formata, sa mjestima ("1.", "3–4.").
function poredakTimova(turnir, runde) {
  var kriteriji = Formati[turnir.postavke.format].kriterijiTimova;
  return poredajSaMjestima(statistikaTimova(turnir, runde), kriteriji, function (r) { return r.tim.naziv; });
}

// ---- Poredak govornika ----

// Statistika govornika pravih timova iz uračunatih rundi, za jednu vrstu govora:
// 'glavni' (glavni govori) ili 'replika' (samo WSDC).
//   { govornik: {...}, tim: {...}, poRundama: { 1: 71.33, 2: 70 }, ukupno: 141.33, govora: 2, prosjek: 70.67 }
// Za glavne govore su na listi svi govornici pravih timova (i oni koji još nisu govorili),
// a za replike samo oni koji su držali barem jednu repliku.
function statistikaGovornika(turnir, runde, vrsta) {
  var redovi = [];
  praviTimovi(turnir).forEach(function (tim) {
    tim.govornici.forEach(function (g) {
      redovi.push({ govornik: g, tim: tim, poRundama: {}, ukupno: 0, govora: 0, prosjek: 0 });
    });
  });
  runde.forEach(function (runda) {
    runda.sobe.forEach(function (soba) {
      rezultatSobe(turnir, soba, soba.rezultat).govornici.forEach(function (govor) {
        var red = redovi.filter(function (r) { return r.govornik.id === govor.id; })[0];
        if (!red || govor.vrsta !== vrsta) {
          return; // govornik swing tima, ili druga vrsta govora
        }
        red.poRundama[runda.broj] = govor.bod;
        red.ukupno += govor.bod;
        red.govora++;
      });
    });
  });
  redovi.forEach(function (r) {
    r.prosjek = r.govora > 0 ? r.ukupno / r.govora : 0;
  });
  if (vrsta === 'replika') {
    return redovi.filter(function (r) { return r.govora > 0; });
  }
  return redovi;
}

// Poredak govornika: po ukupnim bodovima glavnih govora kroz sve runde.
function poredakGovornika(turnir, runde) {
  return poredajSaMjestima(statistikaGovornika(turnir, runde, 'glavni'), ['ukupno'], imeGovornika);
}

// Tabela "Replike" (WSDC): po prosjeku ili ukupnim bodovima replika (postavka).
function poredakReplika(turnir, runde) {
  var kriterij = turnir.postavke.poredakReplika === 'ukupno' ? 'ukupno' : 'prosjek';
  return poredajSaMjestima(statistikaGovornika(turnir, runde, 'replika'), [kriterij], imeGovornika);
}

function imeGovornika(r) {
  return r.govornik.ime;
}

// ---- Mjesta i izjednačeni ----

// Poredaj redove po kriterijima (za svaki kriterij: više je bolje) i svakom redu
// dodaj mjesto. Prvo se gleda prvi kriterij; tek ako je on jednak, drugi, itd.
// Redovi koji su jednaki po SVIM kriterijima dijele mjesto: npr. dva tima iza
// prva dva dobiju "3–4.", a sljedeći tim je "5.". Među njima je redoslijed po abecedi,
// samo da tabela uvijek izgleda isto (to nije kriterij).
function poredajSaMjestima(redovi, kriteriji, ime) {
  function uporedi(a, b) {
    for (var i = 0; i < kriteriji.length; i++) {
      var razlika = zaPoredjenje(b[kriteriji[i]]) - zaPoredjenje(a[kriteriji[i]]);
      if (razlika !== 0) {
        return razlika;
      }
    }
    return 0;
  }
  var poredani = redovi.slice().sort(function (a, b) {
    return uporedi(a, b) || ime(a).localeCompare(ime(b), 'bs', { numeric: true });
  });

  var pocetak = 0;
  while (pocetak < poredani.length) {
    // Grupa izjednačenih: od "pocetak" do "kraj".
    var kraj = pocetak;
    while (kraj + 1 < poredani.length && uporedi(poredani[pocetak], poredani[kraj + 1]) === 0) {
      kraj++;
    }
    var mjesto = pocetak === kraj ? (pocetak + 1) + '.' : (pocetak + 1) + '–' + (kraj + 1) + '.';
    for (var i = pocetak; i <= kraj; i++) {
      poredani[i].mjesto = mjesto;
    }
    pocetak = kraj + 1;
  }
  return poredani;
}

// Bodovi su prosjeci sudija (npr. 71,333...), a računar decimalne brojeve ne pamti
// sasvim tačno: 71,333... + 70,666... može ispasti 141,99999999. Zato se prije
// poređenja zaokruži na tri decimale, da se jednaki bodovi zaista vide kao jednaki.
function zaPoredjenje(broj) {
  return Math.round(broj * 1000) / 1000;
}
