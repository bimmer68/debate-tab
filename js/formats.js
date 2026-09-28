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
    opis: '2 tima (Propozicija i Opozicija), po 3 govornika, plus replika.',
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
