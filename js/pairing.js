// Algoritam parovanja za rundu 1: pravljenje soba i dodjela sudija.
// Ovdje je samo "računanje", bez prikaza i bez spremanja.
// Podatke o rundama (nacrt, objava, swing timovi) čuva rounds.js,
// a stranicu Runde crta rounds-page.js.
//
// Ideja je ista i za timove i za sudije:
//   1. nasumično promiješaj,
//   2. rasporedi po sobama, pazeći na klubove,
//   3. popravi raspored zamjenama dok god zamjena smanjuje broj problema,
//   4. ponovi sve to više puta i zadrži najbolji raspored.
// Timova je najviše 16, pa je sve ovo za računar trenutno.

// Koliko puta se cijeli postupak ponovi (ako ranije ne nađe raspored bez problema).
var BROJ_POKUSAJA = 100;

// Kopija liste u nasumičnom redoslijedu (Fisher–Yates miješanje).
// Ide od kraja prema početku i svaku stavku zamijeni sa nasumično izabranom
// stavkom ispred nje (ili sa samom sobom). Svaki redoslijed je jednako vjerovatan.
function promijesaj(lista) {
  var kopija = lista.slice();
  for (var i = kopija.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var privremeno = kopija[i];
    kopija[i] = kopija[j];
    kopija[j] = privremeno;
  }
  return kopija;
}

// Da li su dva učesnika iz istog kluba. Prazan klub (nezavisni sudija,
// swing tim) nije ni sa kim u istom klubu.
function istiKlub(klubA, klubB) {
  return klubA !== '' && klubA === klubB;
}

// Broj parova timova iz istog kluba u jednoj sobi.
// soba: niz timova, npr. [{ id: 't1', klubId: 'k1' }, { id: 't2', klubId: 'k1' }]
function parovaIzIstogKluba(soba) {
  var broj = 0;
  for (var i = 0; i < soba.length; i++) {
    for (var j = i + 1; j < soba.length; j++) {
      if (istiKlub(soba[i].klubId, soba[j].klubId)) {
        broj++;
      }
    }
  }
  return broj;
}

// Da li sudija ima konflikt sa sobom (sudi timu iz svog kluba).
function sudijaImaKonflikt(sudija, soba) {
  for (var i = 0; i < soba.length; i++) {
    if (istiKlub(sudija.klubId, soba[i].klubId)) {
      return true;
    }
  }
  return false;
}

// Broj sudija u panelu koji imaju konflikt sa sobom.
function konfliktaUPanelu(panel, soba) {
  return panel.filter(function (sudija) { return sudijaImaKonflikt(sudija, soba); }).length;
}

// Zbir kazni svih grupa (manje = bolje, 0 = nema nijednog problema).
function ukupnaKazna(grupe, kazna) {
  var zbir = 0;
  for (var i = 0; i < grupe.length; i++) {
    zbir += kazna(grupe[i], i);
  }
  return zbir;
}

// Popravljanje zamjenama: probaj zamijeniti svaku stavku jedne grupe sa svakom
// stavkom druge grupe. Ako zamjena smanji broj problema, zadrži je; ako ne, vrati.
// Ponavlja se dok god ima zamjena koje pomažu.
// kazna(grupa, indeksGrupe) vraća broj problema u jednoj grupi.
function poboljsajZamjenama(grupe, kazna) {
  var bilo = true;
  while (bilo) {
    bilo = false;
    for (var a = 0; a < grupe.length; a++) {
      for (var b = a + 1; b < grupe.length; b++) {
        for (var i = 0; i < grupe[a].length; i++) {
          for (var j = 0; j < grupe[b].length; j++) {
            var prije = kazna(grupe[a], a) + kazna(grupe[b], b);
            zamijeni(grupe[a], i, grupe[b], j);
            var poslije = kazna(grupe[a], a) + kazna(grupe[b], b);
            if (poslije < prije) {
              bilo = true;
            } else {
              zamijeni(grupe[a], i, grupe[b], j); // nije pomoglo, vrati kako je bilo
            }
          }
        }
      }
    }
  }
}

function zamijeni(listaA, i, listaB, j) {
  var privremeno = listaA[i];
  listaA[i] = listaB[j];
  listaB[j] = privremeno;
}

// Prvi, brzi raspored timova: uzmi prvi slobodan tim, pa mu dodaj timove
// iz drugih klubova. Tek ako takvih nema, dodaj bilo koji.
function rasporediTimove(timovi, timovaPoSobi) {
  var preostali = timovi.slice();
  var sobe = [];
  while (preostali.length > 0) {
    var soba = [preostali.shift()];
    while (soba.length < timovaPoSobi && preostali.length > 0) {
      var indeks = 0;
      for (var i = 0; i < preostali.length; i++) {
        if (parovaIzIstogKluba(soba.concat([preostali[i]])) === 0) {
          indeks = i;
          break;
        }
      }
      soba.push(preostali.splice(indeks, 1)[0]);
    }
    sobe.push(soba);
  }
  return sobe;
}

// Napravi sobe za rundu 1.
// timovi: [{ id, klubId }], a broj timova mora biti djeljiv sa timovaPoSobi.
// Vraća niz soba, a svaka soba je niz id-jeva timova po pozicijama,
// npr. [['t3', 't1'], ['t2', 't4']] (prvi je Propozicija, drugi Opozicija).
function napraviSobe(timovi, timovaPoSobi) {
  var najbolje = null;
  var najmanjaKazna = Infinity;
  for (var pokusaj = 0; pokusaj < BROJ_POKUSAJA && najmanjaKazna > 0; pokusaj++) {
    var sobe = rasporediTimove(promijesaj(timovi), timovaPoSobi);
    poboljsajZamjenama(sobe, parovaIzIstogKluba);
    var kazna = ukupnaKazna(sobe, parovaIzIstogKluba);
    if (kazna < najmanjaKazna) {
      najbolje = sobe;
      najmanjaKazna = kazna;
    }
  }
  // Strane (pozicije) se dodjeljuju nasumično: promiješaj timove unutar sobe.
  return najbolje.map(function (soba) {
    return promijesaj(soba).map(function (tim) { return tim.id; });
  });
}

// Dodijeli sudije sobama.
// sobe: niz soba, svaka je niz timova [{ id, klubId }]
// sudije: [{ id, klubId }]
// Svaka soba dobije do velicinaPanela sudija. Sudije se dijele "kao karte",
// krug po krug, pa ako ih nema dovoljno, razlika između soba je najviše jedan.
// Vraća niz panela (id-jevi sudija), po jedan za svaku sobu.
function dodijeliSudije(sobe, sudije, velicinaPanela) {
  var brojSoba = sobe.length;
  // Kazna za jedan panel. Zadnja grupa su slobodne sudije: one nemaju konflikt.
  function kazna(panel, indeks) {
    return indeks === brojSoba ? 0 : konfliktaUPanelu(panel, sobe[indeks]);
  }

  var najbolje = null;
  var najmanjaKazna = Infinity;
  for (var pokusaj = 0; pokusaj < BROJ_POKUSAJA && najmanjaKazna > 0; pokusaj++) {
    var redom = promijesaj(sudije);
    var grupe = [];
    for (var s = 0; s <= brojSoba; s++) {
      grupe.push([]);
    }
    var sljedeci = 0;
    for (var krug = 0; krug < velicinaPanela; krug++) {
      for (var soba = 0; soba < brojSoba && sljedeci < redom.length; soba++) {
        grupe[soba].push(redom[sljedeci++]);
      }
    }
    grupe[brojSoba] = redom.slice(sljedeci); // slobodne sudije
    // Zamjene između soba, i između sobe i slobodnih sudija.
    poboljsajZamjenama(grupe, kazna);
    var ukupno = ukupnaKazna(grupe, kazna);
    if (ukupno < najmanjaKazna) {
      najbolje = grupe;
      najmanjaKazna = ukupno;
    }
  }
  return najbolje.slice(0, brojSoba).map(function (panel) {
    return panel.map(function (sudija) { return sudija.id; });
  });
}
