// Sudijski listići: pravila, provjera ispravnosti i računanje rezultata sobe.
// Izgled forme za unos je u ballots-page.js.
//
// Rezultat se pamti u sobi objavljene runde, ovako:
//   soba.rezultat = {
//     govornici: [['g1', 'g2', 'g3'], ['g4', 'g5', 'g6']],  // po pozicijama u sobi, redom kako govore
//     replika: ['g1', 'g5'],                                // samo WSDC: ko drži repliku za svaki tim
//     listici: [                                            // jedan sudijski listić po sudiji iz sobe
//       { sudijaId: 's2', govori: [[72, 70, 71], [69, 74, 70]], replike: [35, 36] }
//     ]
//   }
// Govornici i replika su zajednički za cijelu sobu (svi sudije gledaju isti debat),
// a bodove svaki sudija daje na svom sudijskom listiću.
//
// Pobjednik i poredak se NE pamte. Uvijek se izračunaju iz bodova (vidi rezultatSobe),
// pa nikad ne mogu biti u neskladu sa bodovima.

// ---- Redoslijed govora ----

// Svi govori u redoslijedu kojim se drže. Npr. WSDC 3v3:
//   P1, O1, P2, O2, P3, O3, Replika O, Replika P
// BP: OG1, OO1, OG2, OO2, CG1, CO1, CG2, CO2
// Svaki govor izgleda ovako:
//   { tim: 0, mjesto: 2, oznaka: 'P3', vrsta: 'glavni' }   (tim = indeks pozicije u sobi)
//   { tim: 1, mjesto: -1, oznaka: 'Replika O', vrsta: 'replika' }
function redoslijedGovora(turnir) {
  var format = Formati[turnir.postavke.format];
  var broj = brojGovornika(turnir);
  var govori = [];
  // Timovi govore u parovima: (0, 1), pa kod BP-a još (2, 3).
  for (var par = 0; par < format.timovaPoSobi; par += 2) {
    for (var mjesto = 0; mjesto < broj; mjesto++) {
      for (var tim = par; tim < par + 2; tim++) {
        govori.push({ tim: tim, mjesto: mjesto, oznaka: format.oznake[tim] + (mjesto + 1), vrsta: 'glavni' });
      }
    }
  }
  // Replika: prvo Opozicija, pa Propozicija.
  if (format.imaRepliku) {
    govori.push({ tim: 1, mjesto: -1, oznaka: 'Replika ' + format.oznake[1], vrsta: 'replika' });
    govori.push({ tim: 0, mjesto: -1, oznaka: 'Replika ' + format.oznake[0], vrsta: 'replika' });
  }
  return govori;
}

function imaRepliku(turnir) {
  return Formati[turnir.postavke.format].imaRepliku;
}

// Raspon bodova iz Postavki za glavni govor ili repliku, npr. { min: 60, max: 80 }.
function rasponZaGovor(turnir, vrsta) {
  var rasponi = turnir.postavke.rasponi;
  if (vrsta === 'replika') {
    return rasponi.replika;
  }
  return rasponi.glavni || rasponi.govor;
}

// ---- Imena polja na formi ----
// Provjera vraća greške pod ovim imenima, a forma ih koristi kao imena polja,
// pa se svaka greška prikaže tačno pored svog polja.

function poljeGovornika(tim, mjesto) {
  return 'red-' + tim + '-' + mjesto;
}

function poljeReplike(tim) {
  return 'rep-' + tim;
}

// Bod jednog govora na sudijskom listiću (listic = redni broj listića, tj. sudije u sobi). Za repliku je mjesto -1.
function poljeBoda(listic, tim, mjesto) {
  return 'bod-' + listic + '-' + tim + '-' + (mjesto === -1 ? 'r' : mjesto);
}

// ---- Provjera ----

// Greška za jedan bod (upisan kao tekst), ili prazan tekst ako je bod ispravan.
// Bod mora biti cijeli broj unutar raspona iz Postavki.
function greskaBoda(tekst, raspon) {
  var greska = greskaBroja(tekst); // prazno, negativno, nije cijeli broj (vidi settings.js)
  if (greska) {
    return greska;
  }
  var broj = Number(tekst.trim());
  if (broj < raspon.min || broj > raspon.max) {
    return 'Bod mora biti od ' + raspon.min + ' do ' + raspon.max + '.';
  }
  return '';
}

// Provjeri sve što je upisano na formi za jednu sobu.
// podaci izgledaju kao soba.rezultat, samo što su bodovi još tekst (onako kako su upisani):
//   { govornici: [['g1', ...], ...], replika: ['g1', 'g5'],
//     listici: [{ sudijaId: 's2', govori: [['72', '70', '71'], ...], replike: ['35', '36'] }] }
// Provjera ide u tri nivoa:
//   1. polja:  svaki bod i svaki izbor govornika posebno,
//   2. listić: ukupni bodovi timova na jednom sudijskom listiću (neriješeno nije dozvoljeno),
//   3. soba:   da li je iz svih sudijskih listića jasno ko je pobijedio.
// Vraća { polja: { imePolja: 'greška' }, listici: ['greška' ili '' za svaki sudijski listić], soba: 'greška' ili '' }.
function provjeriListice(turnir, soba, podaci) {
  var greske = { polja: {}, listici: [], soba: '' };
  provjeriGovornike(turnir, soba, podaci, greske.polja);

  var govori = redoslijedGovora(turnir);
  var sviBodoviIspravni = true;
  podaci.listici.forEach(function (listic, b) {
    var bodoviIspravni = true;
    govori.forEach(function (govor) {
      var greska = greskaBoda(tekstBoda(listic, govor), rasponZaGovor(turnir, govor.vrsta));
      if (greska) {
        greske.polja[poljeBoda(b, govor.tim, govor.mjesto)] = greska;
        bodoviIspravni = false;
      }
    });
    // Zbir se provjerava tek kad su svi bodovi na sudijskom listiću ispravni.
    greske.listici.push(bodoviIspravni ? greskaZbira(turnir, zbiroviListica(turnir, pretvoriListic(listic))) : '');
    if (!bodoviIspravni || greske.listici[b]) {
      sviBodoviIspravni = false;
    }
  });

  if (podaci.listici.length === 0) {
    greske.soba = 'Soba nema nijednog sudiju, pa nema ni sudijskih listića.';
  } else if (sviBodoviIspravni && !rezultatSobe(turnir, soba, pretvoriRezultat(podaci)).odluceno) {
    greske.soba = 'Iz sudijskih listića se ne može odrediti pobjednik sobe (sudije su podijeljene). ' +
      'Sudije moraju odlučiti i promijeniti bodove.';
  }
  return greske;
}

// Da li provjera nije našla nijednu grešku.
function listiciIspravni(greske) {
  return Object.keys(greske.polja).length === 0 && !greske.soba &&
    greske.listici.every(function (g) { return !g; });
}

// Govorni redoslijed i replika:
// - svaki govornik mora biti iz svog tima i govoriti tačno jednom,
// - WSDC: repliku drži jedini govornik (1v1) ili bilo ko osim zadnjeg (3v3, 4v4).
function provjeriGovornike(turnir, soba, podaci, greske) {
  var broj = brojGovornika(turnir);
  soba.timovi.forEach(function (timId, t) {
    var tim = nadjiPoId(turnir.timovi, timId);
    var clanovi = tim ? tim.govornici.map(function (g) { return g.id; }) : [];
    var redoslijed = podaci.govornici[t] || [];
    for (var i = 0; i < broj; i++) {
      var id = redoslijed[i];
      if (clanovi.indexOf(id) === -1) {
        greske[poljeGovornika(t, i)] = 'Izaberi govornika.';
      } else if (redoslijed.indexOf(id) < i) {
        greske[poljeGovornika(t, i)] = 'Ovaj govornik već govori kao ' + (redoslijed.indexOf(id) + 1) + '. govornik.';
      }
    }

    if (imaRepliku(turnir)) {
      var replika = podaci.replika[t];
      if (clanovi.indexOf(replika) === -1) {
        greske[poljeReplike(t)] = 'Izaberi ko drži repliku.';
      } else if (broj > 1 && replika === redoslijed[broj - 1]) {
        greske[poljeReplike(t)] = 'Repliku ne može držati zadnji govornik.';
      }
    }
  });
}

// Neriješeno nije dozvoljeno: na jednom sudijskom listiću nijedna dva tima ne smiju imati isti zbir.
// Kod WSDC-a i Karla Poppera to znači da zbirovi dva tima ne smiju biti jednaki,
// a kod BP-a da sva četiri zbira moraju biti različita (da poredak 1–4 bude jasan).
function greskaZbira(turnir, zbirovi) {
  var oznake = Formati[turnir.postavke.format].oznake;
  for (var i = 0; i < zbirovi.length; i++) {
    for (var j = i + 1; j < zbirovi.length; j++) {
      if (zbirovi[i] === zbirovi[j]) {
        return 'Neriješeno nije dozvoljeno: ' + oznake[i] + ' i ' + oznake[j] + ' imaju isti zbir (' + zbirovi[i] + '). ' +
          'Sudija mora odlučiti ko je bolji i promijeniti bodove.';
      }
    }
  }
  return '';
}

// ---- Pretvaranje teksta u brojeve ----

function tekstBoda(listic, govor) {
  var tekst = govor.vrsta === 'replika' ? listic.replike[govor.tim] : (listic.govori[govor.tim] || [])[govor.mjesto];
  return typeof tekst === 'string' ? tekst : '';
}

// Sudijski listić sa bodovima kao tekstom -> isti listić sa brojevima.
function pretvoriListic(listic) {
  function broj(tekst) { return Number(String(tekst).trim()); }
  return {
    sudijaId: listic.sudijaId,
    govori: listic.govori.map(function (tim) { return tim.map(broj); }),
    replike: listic.replike.map(broj)
  };
}

// Podaci sa forme -> rezultat sobe za spremanje. Poziva se tek kad je provjera prošla.
function pretvoriRezultat(podaci) {
  return {
    govornici: podaci.govornici.map(function (red) { return red.slice(); }),
    replika: podaci.replika.slice(),
    listici: podaci.listici.map(pretvoriListic)
  };
}

// ---- Računanje rezultata ----

// Zbir bodova svakog tima na jednom sudijskom listiću (glavni govori + replika), npr. [214, 213].
function zbiroviListica(turnir, listic) {
  return listic.govori.map(function (bodovi, t) {
    var zbir = 0;
    bodovi.forEach(function (bod) { zbir += bod; });
    if (imaRepliku(turnir)) {
      zbir += listic.replike[t];
    }
    return zbir;
  });
}

// Poredak timova na jednom sudijskom listiću: indeksi pozicija od najvećeg zbira prema najmanjem.
// Npr. zbirovi [150, 162, 148, 155] daju poredak [1, 3, 0, 2] (OO prvi, CO drugi...).
function poredakPoZbiru(zbirovi) {
  var indeksi = zbirovi.map(function (z, i) { return i; });
  return indeksi.sort(function (a, b) { return zbirovi[b] - zbirovi[a]; });
}

// Rezultat sobe izračunat iz svih sudijskih listića (rezultat ima bodove kao brojeve).
// Vraća:
//   {
//     zbirovi: [[214, 213], [210, 215], ...],  // zbir svakog tima na svakom listiću
//     glasovi: [2, 1],          // koliko sudijskih listića je tim dobio (bio prvi na listiću)
//     prosjekZbira: [212.3, 211.7],  // prosječni zbir tima (prosjek svih sudija)
//     poredak: [0, 1],          // poredak u sobi; prvi je pobjednik
//     odluceno: true,           // false ako se poredak ne može odrediti
//     govornici: [{ id: 'g1', tim: 0, vrsta: 'glavni', bod: 71.33 }, ...]  // prosjek svih sudija
//   }
//
// Pravilo: tim pobjeđuje u sobi ako dobije većinu sudijskih listića.
// Kod BP-a (4 tima) isto pravilo, prošireno: za svaki tim se saberu mjesta koja je dobio
// na svim sudijskim listićima (1. mjesto = 0, 2. = 1...). Manji zbir mjesta je bolji. Kod dva tima je
// to isto što i "većina sudijskih listića". Ako dva tima imaju isti zbir mjesta, bolji je onaj sa
// većim prosječnim zbirom bodova. Ako je i to isto, soba nije odlučena.
function rezultatSobe(turnir, soba, rezultat) {
  var brojTimova = soba.timovi.length;
  var zbirovi = rezultat.listici.map(function (listic) { return zbiroviListica(turnir, listic); });
  var glasovi = [];
  var zbirMjesta = [];
  var prosjekZbira = [];
  for (var t = 0; t < brojTimova; t++) {
    glasovi.push(0);
    zbirMjesta.push(0);
    prosjekZbira.push(prosjek(zbirovi.map(function (z) { return z[t]; })));
  }
  zbirovi.forEach(function (z) {
    poredakPoZbiru(z).forEach(function (tim, mjesto) {
      zbirMjesta[tim] += mjesto;
      if (mjesto === 0) {
        glasovi[tim]++;
      }
    });
  });

  function uporedi(a, b) {
    if (zbirMjesta[a] !== zbirMjesta[b]) {
      return zbirMjesta[a] - zbirMjesta[b];
    }
    return prosjekZbira[b] - prosjekZbira[a];
  }
  var poredak = zbirMjesta.map(function (z, i) { return i; }).sort(uporedi);
  var odluceno = rezultat.listici.length > 0;
  for (var i = 1; i < poredak.length; i++) {
    if (uporedi(poredak[i - 1], poredak[i]) === 0) {
      odluceno = false;
    }
  }

  return {
    zbirovi: zbirovi,
    glasovi: glasovi,
    prosjekZbira: prosjekZbira,
    poredak: poredak,
    odluceno: odluceno,
    govornici: prosjeciGovornika(turnir, rezultat)
  };
}

// Bod govornika u rundi = prosjek bodova svih sudija u sobi.
function prosjeciGovornika(turnir, rezultat) {
  var lista = [];
  rezultat.govornici.forEach(function (redoslijed, t) {
    redoslijed.forEach(function (id, mjesto) {
      var bodovi = rezultat.listici.map(function (listic) { return listic.govori[t][mjesto]; });
      lista.push({ id: id, tim: t, vrsta: 'glavni', bod: prosjek(bodovi) });
    });
  });
  if (imaRepliku(turnir)) {
    rezultat.replika.forEach(function (id, t) {
      var bodovi = rezultat.listici.map(function (listic) { return listic.replike[t]; });
      lista.push({ id: id, tim: t, vrsta: 'replika', bod: prosjek(bodovi) });
    });
  }
  return lista;
}

function prosjek(brojevi) {
  if (brojevi.length === 0) {
    return 0;
  }
  var zbir = 0;
  brojevi.forEach(function (b) { zbir += b; });
  return zbir / brojevi.length;
}

// Bod za prikaz: najviše dvije decimale, sa zarezom. 71.333 -> "71,33", 72 -> "72".
function tekstBodova(broj) {
  return String(Math.round(broj * 100) / 100).replace('.', ',');
}

// Koliko soba runde ima unesene sudijske listiće.
function brojUnesenihSoba(runda) {
  return runda.sobe.filter(function (s) { return s.rezultat; }).length;
}

// Obriši sve unesene sudijske listiće runde (npr. kad se runda vrati u nacrt,
// jer se tada timovi i sudije mogu zamijeniti, pa listići više ne bi odgovarali).
function obrisiListiceRunde(runda) {
  runda.sobe.forEach(function (s) { delete s.rezultat; });
}

// ---- Čišćenje podataka ----
// Poziva se iz ocistiRunde (rounds.js) za svaku sobu objavljene runde.
// Vraća rezultat ako ima ispravan oblik, inače null (rezultat se odbaci,
// a soba je opet "nije uneseno").
// Stariji podaci (prije preimenovanja) listiće čuvaju pod imenom "balote",
// pa se i to ime prihvata, da stari backup fajlovi i dalje rade.
function ocistiRezultat(r, brojTimova) {
  if (r && typeof r === 'object' && !r.listici && Array.isArray(r.balote)) {
    r = { govornici: r.govornici, replika: r.replika, listici: r.balote };
  }
  if (!r || typeof r !== 'object' || !Array.isArray(r.govornici) || !Array.isArray(r.listici) ||
      r.govornici.length !== brojTimova || r.listici.length === 0) {
    return null;
  }
  var replika = Array.isArray(r.replika) ? r.replika : [];
  var ispravno = r.govornici.every(function (red) { return Array.isArray(red) && red.every(jeTekst); }) &&
    replika.every(jeTekst) &&
    r.listici.every(function (l) {
      return l && jeTekst(l.sudijaId) && Array.isArray(l.govori) && l.govori.length === brojTimova &&
        l.govori.every(function (bodovi, t) {
          return Array.isArray(bodovi) && bodovi.length === r.govornici[t].length && bodovi.every(Number.isInteger);
        }) &&
        Array.isArray(l.replike) && l.replike.length === replika.length && l.replike.every(Number.isInteger);
    });
  if (!ispravno) {
    return null;
  }
  return {
    govornici: r.govornici.map(function (red) { return red.slice(); }),
    replika: replika.slice(),
    listici: r.listici.map(function (l) {
      return { sudijaId: l.sudijaId, govori: l.govori.map(function (x) { return x.slice(); }), replike: l.replike.slice() };
    })
  };
}
