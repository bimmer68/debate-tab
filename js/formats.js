// Debatni formati i njihovi zadani rasponi bodova.
// Kad se u postavkama izabere format, ovdje piše koje raspone bodova ima
// i koje su zadane vrijednosti. Korisnik ih kasnije može promijeniti.

var Formati = {
  wsdc: {
    naziv: 'World Schools (WSDC)',
    kratkiNaziv: 'WSDC',
    // Zadani rasponi ovog formata su ujedno i standard iz README-a.
    // Ako tab direktor unese nešto drugo, aplikacija upozori (ali ne zabrani).
    imaStandard: true,
    opis: '2 tima (Propozicija i Opozicija), po 1, 3 ili 4 govornika, plus replika.',
    // Veličina tima je postavka turnira (bira se jednom za cijeli turnir).
    // Tim ima tačno onoliko članova koliko govori, bez rezervi.
    // Replika postoji u svim varijantama: u 1v1 je drži jedini govornik,
    // a u 3v3 i 4v4 bilo koji govornik osim zadnjeg.
    // Redoslijed: P1, O1, P2, O2... pa replika Opozicije, pa replika Propozicije.
    velicineTima: [1, 3, 4],
    brojGovornika: 3, // zadana veličina tima
    // Koliko timova je u jednoj sobi i kako se zovu njihove pozicije (redom).
    timovaPoSobi: 2,
    pozicije: ['Propozicija', 'Opozicija'],
    rasponi: {
      glavni: { naziv: 'Glavni govor', min: 60, max: 80 },
      replika: { naziv: 'Replika', min: 30, max: 40 }
    }
  },
  bp: {
    naziv: 'British Parliamentary (BP)',
    kratkiNaziv: 'BP',
    imaStandard: true,
    opis: '4 tima (OG, OO, CG, CO), po 2 govornika.',
    brojGovornika: 2,
    timovaPoSobi: 4,
    pozicije: ['Otvaranje Vlade (OG)', 'Otvaranje Opozicije (OO)', 'Zatvaranje Vlade (CG)', 'Zatvaranje Opozicije (CO)'],
    rasponi: {
      govor: { naziv: 'Govor', min: 50, max: 100 }
    }
  },
  kp: {
    naziv: 'Karl Popper',
    kratkiNaziv: 'Karl Popper',
    // Standard još nije definisan, pa nema upozorenja o odstupanju.
    imaStandard: false,
    opis: '2 tima (Afirmacija i Negacija), po 3 govornika.',
    brojGovornika: 3,
    timovaPoSobi: 2,
    pozicije: ['Afirmacija', 'Negacija'],
    // Pretpostavka: isti raspon kao glavni govor u WSDC-u.
    // Vlasnik projekta treba potvrditi, a do tada se može promijeniti u postavkama.
    napomena: 'Raspon 60–80 je privremena pretpostavka dok se ne potvrdi.',
    rasponi: {
      govor: { naziv: 'Govor', min: 60, max: 80 }
    }
  }
};

// Zadani rasponi za jedan format, npr. { glavni: { min: 60, max: 80 }, ... }
function zadaniRasponi(formatKljuc) {
  var definicije = Formati[formatKljuc].rasponi;
  var rasponi = {};
  for (var kljuc in definicije) {
    rasponi[kljuc] = { min: definicije[kljuc].min, max: definicije[kljuc].max };
  }
  return rasponi;
}

// Rasponi koji se razlikuju od standarda formata, kao tekst,
// npr. ['Glavni govor: 60–80']. Prazna lista znači da nema odstupanja
// (ili da format nema standard, kao Karl Popper).
function odstupanjaOdStandarda(formatKljuc, rasponi) {
  var format = Formati[formatKljuc];
  var odstupanja = [];
  if (!format.imaStandard) {
    return odstupanja;
  }
  for (var kljuc in format.rasponi) {
    var standard = format.rasponi[kljuc];
    if (rasponi[kljuc].min !== standard.min || rasponi[kljuc].max !== standard.max) {
      odstupanja.push(standard.naziv + ': ' + standard.min + '–' + standard.max);
    }
  }
  return odstupanja;
}
