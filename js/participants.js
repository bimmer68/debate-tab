// Učesnici turnira: klubovi, timovi (sa govornicima) i sudije.
// Ovdje su samo podaci i pravila. Izgled stranica je u teams.js i judges.js.
//
// U turniru izgledaju ovako:
//   klubovi: [{ id: 'k1', naziv: 'Gimnazija Mostar' }]
//   timovi:  [{ id: 't1', naziv: 'Mostar A', klubId: 'k1',
//               govornici: [{ id: 'g1', ime: 'Ana' }, { id: 'g2', ime: 'Marko' }] }]
//   sudije:  [{ id: 's1', ime: 'Lejla', klubId: 'k1' }]   (klubId '' = nezavisni sudija)
//
// Svaki učesnik ima svoj id. Kasnije faze (parovi, balote) pamte samo id,
// pa promjena imena ne kvari ništa što je već uneseno.

// README: turnir ima najviše 16 timova.
var NAJVISE_TIMOVA = 16;
var NAJDUZI_NAZIV = 100;

// Novi id koji još niko nema, npr. 't7' ako je najveći postojeći 't6'.
function noviId(prefiks, lista) {
  var najveci = 0;
  for (var i = 0; i < lista.length; i++) {
    var broj = Number(lista[i].id.slice(prefiks.length));
    if (lista[i].id.indexOf(prefiks) === 0 && broj > najveci) {
      najveci = broj;
    }
  }
  return prefiks + (najveci + 1);
}

// Svi govornici iz svih timova u jednoj listi.
function sviGovornici(turnir) {
  var svi = [];
  for (var i = 0; i < turnir.timovi.length; i++) {
    svi = svi.concat(turnir.timovi[i].govornici);
  }
  return svi;
}

function nadjiPoId(lista, id) {
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      return lista[i];
    }
  }
  return null;
}

function nazivKluba(turnir, klubId) {
  var klub = nadjiPoId(turnir.klubovi, klubId);
  return klub ? klub.naziv : '';
}

// Koliko govornika ima tim u formatu iz postavki.
function brojGovornika(turnir) {
  return Formati[turnir.postavke.format].brojGovornika;
}

// "  Gimnazija   MOSTAR " i "gimnazija mostar" se smatraju istim imenom.
function uporedivoIme(tekst) {
  return tekst.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Da li u listi već postoji neko drugi (sa drugim id-jem) sa istim imenom.
function imeZauzeto(lista, polje, ime, osimId) {
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].id !== osimId && uporedivoIme(lista[i][polje]) === uporedivoIme(ime)) {
      return true;
    }
  }
  return false;
}

// ---- Provjere ----
// Svaka vraća objekat grešaka: { imePolja: 'tekst greške' }.
// Prazan objekat znači da je sve u redu. osimId je id onoga što se uređuje
// (prazno kod dodavanja), da se ime ne poredi samo sa sobom.

function provjeriKlub(turnir, naziv, osimId) {
  var greske = {};
  if (naziv.trim() === '') {
    greske.nazivKluba = 'Upiši naziv kluba.';
  } else if (imeZauzeto(turnir.klubovi, 'naziv', naziv, osimId)) {
    greske.nazivKluba = 'Klub sa ovim nazivom već postoji.';
  }
  return greske;
}

// podaci: { naziv: '...', klubId: 'k1', govornici: ['Ana', 'Marko', ...] }
function provjeriTim(turnir, podaci, osimId) {
  var greske = {};
  if (podaci.naziv.trim() === '') {
    greske.nazivTima = 'Upiši naziv tima.';
  } else if (imeZauzeto(turnir.timovi, 'naziv', podaci.naziv, osimId)) {
    greske.nazivTima = 'Tim sa ovim nazivom već postoji.';
  }

  if (turnir.klubovi.length === 0) {
    greske.klubTima = 'Prvo dodaj klub u dijelu "Klubovi".';
  } else if (!nadjiPoId(turnir.klubovi, podaci.klubId)) {
    greske.klubTima = 'Izaberi klub.';
  }

  var vidjena = [];
  for (var i = 0; i < podaci.govornici.length; i++) {
    var ime = podaci.govornici[i];
    var polje = 'govornik' + (i + 1);
    if (ime.trim() === '') {
      greske[polje] = 'Upiši ime govornika.';
    } else if (vidjena.indexOf(uporedivoIme(ime)) !== -1) {
      greske[polje] = 'Ovaj govornik je već upisan u tim.';
    }
    vidjena.push(uporedivoIme(ime));
  }
  return greske;
}

// podaci: { ime: '...', klubId: 'k1' ili '' }
function provjeriSudiju(turnir, podaci, osimId) {
  var greske = {};
  if (podaci.ime.trim() === '') {
    greske.imeSudije = 'Upiši ime sudije.';
  } else if (imeZauzeto(turnir.sudije, 'ime', podaci.ime, osimId)) {
    greske.imeSudije = 'Sudija sa ovim imenom već postoji.';
  }
  if (podaci.klubId !== '' && !nadjiPoId(turnir.klubovi, podaci.klubId)) {
    greske.klubSudije = 'Izaberi klub.';
  }
  return greske;
}

// ---- Izmjene ----
// Mijenjaju objekat turnira. Snimanje u browser radi stranica (sacuvajTurnir).
// Pozivaju se tek kad je provjera prošla bez grešaka.

function snimiKlub(turnir, id, naziv) {
  naziv = naziv.trim();
  var klub = nadjiPoId(turnir.klubovi, id);
  if (klub) {
    klub.naziv = naziv;
  } else {
    turnir.klubovi.push({ id: noviId('k', turnir.klubovi), naziv: naziv });
  }
}

function snimiTim(turnir, id, podaci) {
  var tim = nadjiPoId(turnir.timovi, id);
  if (!tim) {
    tim = { id: noviId('t', turnir.timovi), govornici: [] };
    turnir.timovi.push(tim);
  }
  tim.naziv = podaci.naziv.trim();
  tim.klubId = podaci.klubId;

  // Govornik na istom mjestu zadržava svoj id, i kad mu se ispravi ime.
  var govornici = [];
  for (var i = 0; i < podaci.govornici.length; i++) {
    var stari = tim.govornici[i];
    govornici.push({
      id: stari ? stari.id : noviId('g', sviGovornici(turnir).concat(govornici)),
      ime: podaci.govornici[i].trim()
    });
  }
  tim.govornici = govornici;
}

function snimiSudiju(turnir, id, podaci) {
  var sudija = nadjiPoId(turnir.sudije, id);
  if (!sudija) {
    sudija = { id: noviId('s', turnir.sudije) };
    turnir.sudije.push(sudija);
  }
  sudija.ime = podaci.ime.trim();
  sudija.klubId = podaci.klubId;
}

function ukloniPoId(lista, id) {
  return lista.filter(function (x) { return x.id !== id; });
}

// Koliko timova i sudija pripada klubu.
function clanoviKluba(turnir, klubId) {
  var brojac = { timova: 0, sudija: 0 };
  turnir.timovi.forEach(function (t) { if (t.klubId === klubId) { brojac.timova++; } });
  turnir.sudije.forEach(function (s) { if (s.klubId === klubId) { brojac.sudija++; } });
  return brojac;
}

// Pretpostavka: klub koji ima timove ili sudije se ne može obrisati,
// da niko ne ostane bez kluba (a time i bez provjere konflikata).
// Vraća tekst greške, ili prazan tekst ako je klub obrisan.
function obrisiKlub(turnir, id) {
  var clanovi = clanoviKluba(turnir, id);
  if (clanovi.timova > 0 || clanovi.sudija > 0) {
    return 'Klub se ne može obrisati jer mu pripadaju timovi ili sudije. ' +
      'Prvo ih prebaci u drugi klub ili obriši.';
  }
  turnir.klubovi = ukloniPoId(turnir.klubovi, id);
  return '';
}

function obrisiTim(turnir, id) {
  turnir.timovi = ukloniPoId(turnir.timovi, id);
}

function obrisiSudiju(turnir, id) {
  turnir.sudije = ukloniPoId(turnir.sudije, id);
}

// ---- Čišćenje podataka ----
// Poziva se kod učitavanja iz browsera i kod uvoza JSON fajla.
// Izbaci sve što nije ispravno (npr. iz ručno uređenog fajla),
// da ostatak aplikacije može vjerovati podacima.

function ocistiUcesnike(podaci) {
  var klubovi = ocistiListu(podaci.klubovi, function (k) {
    return jeTekst(k.naziv) ? { id: k.id, naziv: k.naziv } : null;
  });

  // Tim ili sudija sa nepoznatim klubom ostaje, ali bez kluba.
  function postojeciKlub(klubId) {
    return nadjiPoId(klubovi, klubId) ? klubId : '';
  }

  var vidjeniGovornici = [];
  var timovi = ocistiListu(podaci.timovi, function (t) {
    if (!jeTekst(t.naziv)) {
      return null;
    }
    var govornici = ocistiListu(t.govornici, function (g) {
      if (!jeTekst(g.ime) || vidjeniGovornici.indexOf(g.id) !== -1) {
        return null;
      }
      vidjeniGovornici.push(g.id);
      return { id: g.id, ime: g.ime };
    });
    return { id: t.id, naziv: t.naziv, klubId: postojeciKlub(t.klubId), govornici: govornici };
  });

  var sudije = ocistiListu(podaci.sudije, function (s) {
    return jeTekst(s.ime) ? { id: s.id, ime: s.ime, klubId: postojeciKlub(s.klubId) } : null;
  });

  return { klubovi: klubovi, timovi: timovi, sudije: sudije };
}

// Zadrži samo stavke koje imaju id (tekst, bez ponavljanja)
// i koje funkcija ocisti prihvati (vrati nešto umjesto null).
function ocistiListu(lista, ocisti) {
  var rezultat = [];
  if (!Array.isArray(lista)) {
    return rezultat;
  }
  for (var i = 0; i < lista.length; i++) {
    var x = lista[i];
    if (!x || typeof x !== 'object' || !jeTekst(x.id) || nadjiPoId(rezultat, x.id)) {
      continue;
    }
    var cisto = ocisti(x);
    if (cisto) {
      rezultat.push(cisto);
    }
  }
  return rezultat;
}

// Tekst koji nije prazan.
function jeTekst(x) {
  return typeof x === 'string' && x.trim() !== '';
}
