// Stranica "Postavke": naziv, format, broj rundi, rasponi bodova,
// te izvoz i uvoz turnira (backup).

function stranicaPostavki() {
  var p = ucitajTurnir().postavke;

  var opcijeFormata = '';
  for (var kljuc in Formati) {
    opcijeFormata +=
      '<option value="' + kljuc + '"' + (kljuc === p.format ? ' selected' : '') + '>' +
        Formati[kljuc].naziv +
      '</option>';
  }

  return (
    '<h1>Postavke turnira</h1>' +
    '<form id="forma-postavki" class="mreza-postavki" novalidate>' +
      '<section class="kartica">' +
        '<h2>Osnovno</h2>' +
        '<label class="polje">Naziv turnira' +
          '<input type="text" name="naziv" maxlength="100" value="' + sigurnoHtml(p.naziv) + '" placeholder="npr. Kup Sarajeva 2026" aria-describedby="greska-naziv">' +
          mjestoZaGresku('naziv') +
        '</label>' +
        '<label class="polje">Format' +
          '<select name="format" aria-describedby="greska-format">' + opcijeFormata + '</select>' +
          mjestoZaGresku('format') +
        '</label>' +
        '<p id="opis-formata" class="napomena">' + Formati[p.format].opis + '</p>' +
        '<div id="izbor-velicine"' + (Formati[p.format].velicineTima ? '' : ' hidden') + '>' +
          '<label class="polje">Veličina tima (govornika po timu)' +
            '<select name="velicinaTima" aria-describedby="greska-velicinaTima">' +
              opcijeVelicine(p.velicinaTima) +
            '</select>' +
            mjestoZaGresku('velicinaTima') +
          '</label>' +
          '<p class="napomena">Bira se jednom za cijeli turnir. Tim ima tačno onoliko članova ' +
            'koliko govori, bez rezervi.</p>' +
        '</div>' +
        '<label class="polje">Broj preliminarnih rundi' +
          poljeZaBroj('brojRundi', p.brojRundi) +
          mjestoZaGresku('brojRundi') +
        '</label>' +
      '</section>' +
      '<section class="kartica">' +
        '<h2>Rasponi bodova govornika</h2>' +
        '<div id="polja-raspona">' + poljaRaspona(p.format, p.rasponi) + '</div>' +
      '</section>' +
      '<div class="akcije">' +
        '<button type="submit" class="dugme">Sačuvaj postavke</button>' +
        '<span id="poruka-postavki" class="poruka" role="status"></span>' +
      '</div>' +
    '</form>' +
    '<section class="kartica">' +
      '<h2>Backup turnira</h2>' +
      '<p class="napomena">Podaci se čuvaju samo u ovom browseru. Redovno preuzmi backup, ' +
        'a pomoću njega možeš turnir prebaciti i na drugi računar.</p>' +
      '<div class="akcije">' +
        '<button type="button" id="dugme-izvoz" class="dugme">Izvezi u JSON fajl</button>' +
        '<label class="dugme dugme-sporedno">Uvezi iz JSON fajla' +
          '<input type="file" id="uvoz-fajla" accept=".json,application/json" class="skriveno">' +
        '</label>' +
        '<span id="poruka-backup" class="poruka" role="status"></span>' +
      '</div>' +
    '</section>' +
    // Prozor sa upozorenjem; skriven dok ga ne otvori pitajZaOdstupanje.
    '<dialog id="upozorenje-raspona" class="dijalog">' +
      '<form method="dialog">' +
        '<p id="upozorenje-tekst"></p>' +
        '<div class="akcije">' +
          '<button type="submit" value="sacuvaj" class="dugme">Sačuvaj</button>' +
          '<button type="submit" value="odustani" class="dugme dugme-sporedno">Odustani</button>' +
        '</div>' +
      '</form>' +
    '</dialog>'
  );
}

// Opcije 1, 3 i 4 za veličinu WSDC tima.
function opcijeVelicine(odabrana) {
  var html = '';
  Formati.wsdc.velicineTima.forEach(function (broj) {
    html += '<option value="' + broj + '"' + (broj === odabrana ? ' selected' : '') + '>' +
      broj + ' (' + broj + 'v' + broj + ')</option>';
  });
  return html;
}

// Polja "od" i "do" za svaki raspon bodova izabranog formata.
function poljaRaspona(formatKljuc, rasponi) {
  var format = Formati[formatKljuc];
  var html = '';
  for (var kljuc in format.rasponi) {
    html +=
      '<div class="raspon">' +
        '<span class="raspon-naziv">' + format.rasponi[kljuc].naziv + '</span>' +
        '<label class="raspon-polje">od ' + poljeZaBroj(kljuc + '-min', rasponi[kljuc].min) + mjestoZaGresku(kljuc + '-min') + '</label>' +
        '<label class="raspon-polje">do ' + poljeZaBroj(kljuc + '-max', rasponi[kljuc].max) + mjestoZaGresku(kljuc + '-max') + '</label>' +
      '</div>';
  }
  if (format.napomena) {
    html += '<p class="napomena">' + format.napomena + '</p>';
  }
  return html;
}

// Polje za cijeli broj.
// Namjerno NIJE type="number": takvo polje ima strelice gore/dole koje u uskom
// polju pojedu mjesto za cifre, a vrijednost mijenja i točkić miša.
// inputmode="numeric" na mobitelu otvara tastaturu sa brojevima.
function poljeZaBroj(ime, vrijednost) {
  return '<input type="text" inputmode="numeric" autocomplete="off" name="' + ime + '"' +
    ' value="' + vrijednost + '" aria-describedby="greska-' + ime + '">';
}

// Poziva se nakon što se stranica prikaže: povezuje dugmad sa funkcijama.
function pokreniPostavke() {
  var forma = document.getElementById('forma-postavki');

  // Kad se promijeni format, pokaži njegove raspone.
  // Ako je to već spremljeni format, pokaži spremljene vrijednosti, inače zadane.
  forma.format.addEventListener('change', function () {
    var format = forma.format.value;
    var spremljeno = ucitajTurnir().postavke;
    var rasponi = spremljeno.format === format ? spremljeno.rasponi : zadaniRasponi(format);
    document.getElementById('polja-raspona').innerHTML = poljaRaspona(format, rasponi);
    document.getElementById('opis-formata').textContent = Formati[format].opis;
    // Izbor veličine tima postoji samo za WSDC.
    document.getElementById('izbor-velicine').hidden = !Formati[format].velicineTima;
  });

  // Čim korisnik nešto promijeni, stara poruka "Postavke su sačuvane."
  // više ne važi, pa je sklanjamo da ne zbunjuje.
  forma.addEventListener('input', function () {
    prikaziPoruku('poruka-postavki', '', false);
  });

  forma.addEventListener('submit', function (dogadjaj) {
    dogadjaj.preventDefault(); // bez ovoga bi browser ponovo učitao stranicu
    spremiFormuPostavki(forma);
  });

  document.getElementById('dugme-izvoz').addEventListener('click', function () {
    izveziTurnir(ucitajTurnir());
    prikaziPoruku('poruka-backup', 'Fajl je preuzet.', false);
  });

  document.getElementById('uvoz-fajla').addEventListener('change', function () {
    var fajl = this.files[0];
    this.value = ''; // da se isti fajl može ponovo izabrati
    if (fajl) {
      uveziFajl(fajl);
    }
  });
}

function spremiFormuPostavki(forma) {
  // Ako ijedno polje nije ispravno, ne snimamo ništa.
  if (prikaziGreske(forma, provjeriPostavke(forma))) {
    prikaziPoruku('poruka-postavki', 'Postavke nisu sačuvane. Ispravi označena polja.', true);
    return;
  }

  var postavke = procitajPostavke(forma);

  // Raspon koji odstupa od standarda je dozvoljen, ali prvo pitamo.
  var odstupanja = odstupanjaOdStandarda(postavke.format, postavke.rasponi);
  if (odstupanja.length > 0) {
    var tekst = 'Raspon odstupa od standarda za ' + Formati[postavke.format].kratkiNaziv +
      ' (' + odstupanja.join(', ') + '). Sačuvati svejedno?';
    pitajZaOdstupanje(tekst, function (sacuvati) {
      if (sacuvati) {
        snimiPostavke(postavke);
      } else {
        prikaziPoruku('poruka-postavki', 'Postavke nisu sačuvane.', true);
      }
    });
    return;
  }

  snimiPostavke(postavke);
}

function snimiPostavke(postavke) {
  var turnir = ucitajTurnir();
  turnir.postavke = postavke;
  // Swing timovi uvijek imaju onoliko govornika koliko traži format.
  imenujSwingTimove(turnir);
  if (sacuvajTurnir(turnir)) {
    prikaziPoruku('poruka-postavki', 'Postavke su sačuvane.', false);
  } else {
    prikaziPoruku('poruka-postavki', 'Spremanje nije uspjelo. Browser možda ne dozvoljava spremanje podataka.', true);
  }
}

// Otvori prozor sa upozorenjem i dugmadima Sačuvaj / Odustani.
// Kad se prozor zatvori, pozove odgovor(true) za "Sačuvaj", a odgovor(false)
// za "Odustani" ili tipku Esc.
function pitajZaOdstupanje(tekst, odgovor) {
  var prozor = document.getElementById('upozorenje-raspona');
  document.getElementById('upozorenje-tekst').textContent = tekst;
  prozor.returnValue = '';
  prozor.addEventListener('close', function () {
    odgovor(prozor.returnValue === 'sacuvaj');
  }, { once: true });
  prozor.showModal();
}

// Pretvori popunjenu formu u objekat postavki.
// Poziva se tek kad je provjeriPostavke rekla da su sva polja ispravna.
function procitajPostavke(forma) {
  var format = forma.format.value;
  var postavke = {
    naziv: forma.naziv.value.trim(),
    format: format,
    brojRundi: Number(forma.brojRundi.value.trim()),
    velicinaTima: Number(forma.velicinaTima.value),
    rasponi: {}
  };
  for (var kljuc in Formati[format].rasponi) {
    postavke.rasponi[kljuc] = {
      min: Number(forma[kljuc + '-min'].value.trim()),
      max: Number(forma[kljuc + '-max'].value.trim())
    };
  }
  return postavke;
}

// Provjeri sva polja forme. Vraća objekat grešaka: { imePolja: 'tekst greške' }.
// Prazan objekat znači da je sve u redu.
function provjeriPostavke(forma) {
  var greske = {};
  if (forma.naziv.value.trim() === '') {
    greske.naziv = 'Upiši naziv turnira.';
  }

  var greskaRundi = greskaBroja(forma.brojRundi.value);
  if (!greskaRundi) {
    var brojRundi = Number(forma.brojRundi.value.trim());
    if (brojRundi < NAJMANJE_RUNDI || brojRundi > NAJVISE_RUNDI) {
      greskaRundi = 'Broj rundi mora biti od ' + NAJMANJE_RUNDI + ' do ' + NAJVISE_RUNDI + '.';
    }
  }
  if (greskaRundi) {
    greske.brojRundi = greskaRundi;
  }

  var greskaFormata = provjeriPromjenuFormata(forma);
  if (greskaFormata) {
    greske.format = greskaFormata;
  }

  var greskaVelicine = provjeriVelicinuTima(forma);
  if (greskaVelicine) {
    greske.velicinaTima = greskaVelicine;
  }

  for (var kljuc in Formati[forma.format.value].rasponi) {
    var poljeOd = forma[kljuc + '-min'];
    var poljeDo = forma[kljuc + '-max'];
    var greskaOd = greskaBroja(poljeOd.value);
    var greskaDo = greskaBroja(poljeDo.value);
    if (!greskaOd && !greskaDo && Number(poljeOd.value.trim()) >= Number(poljeDo.value.trim())) {
      greskaOd = '"Od" mora biti manje od "do".';
    }
    if (greskaOd) {
      greske[poljeOd.name] = greskaOd;
    }
    if (greskaDo) {
      greske[poljeDo.name] = greskaDo;
    }
  }
  return greske;
}

// Format i veličina tima se ne smiju promijeniti dok postoji runda,
// jer bi sobe imale pogrešan broj timova ili govornika.
function provjeriPromjenuFormata(forma) {
  var turnir = ucitajTurnir();
  var p = turnir.postavke;
  var novaVelicina = Number(forma.velicinaTima.value);
  var promijenjeno = forma.format.value !== p.format ||
    (Formati[p.format].velicineTima && novaVelicina !== p.velicinaTima);
  if (!promijenjeno || turnir.runde.length === 0) {
    return '';
  }
  return 'Format i veličina tima se ne mogu mijenjati dok postoji runda. ' +
    'Prvo obriši nacrt runde na stranici Runde (objavljenu rundu prvo vrati u nacrt).';
}

// Veličina WSDC tima se ne smije promijeniti ako bi postojeći timovi
// ostali sa pogrešnim brojem govornika. Tab direktor ih prvo mora urediti ili obrisati.
function provjeriVelicinuTima(forma) {
  var turnir = ucitajTurnir();
  var nova = Number(forma.velicinaTima.value);
  if (!Formati[forma.format.value].velicineTima || nova === turnir.postavke.velicinaTima) {
    return '';
  }
  var drugaciji = timoviSaDrugimBrojem(turnir, nova);
  if (drugaciji === 0) {
    return '';
  }
  return 'Veličina tima se ne može promijeniti na ' + nova + ': ' +
    tekstBroja(drugaciji, 'tim ima', 'tima imaju', 'timova ima') + ' drugi broj govornika. ' +
    'Prvo ih uredi ili obriši na stranici Timovi.';
}

// Greška za jedno polje sa brojem, ili prazan tekst ako je broj ispravan.
function greskaBroja(tekst) {
  tekst = tekst.trim();
  if (tekst === '') {
    return 'Upiši broj.';
  }
  if (tekst.charAt(0) === '-') {
    return 'Broj ne smije biti negativan.';
  }
  if (!/^[0-9]+$/.test(tekst)) {
    return 'Upiši cijeli broj, samo cifre.';
  }
  return '';
}

function uveziFajl(fajl) {
  procitajFajlTurnira(fajl, function (greska, turnir) {
    if (greska) {
      prikaziPoruku('poruka-backup', greska, true);
      return;
    }
    if (!confirm('Uvoz će zamijeniti trenutni turnir podacima iz fajla. Nastaviti?')) {
      return;
    }
    if (!sacuvajTurnir(turnir)) {
      prikaziPoruku('poruka-backup', 'Spremanje nije uspjelo.', true);
      return;
    }
    prikaziStranicu(); // ponovo nacrtaj stranicu sa uvezenim podacima
    prikaziPoruku('poruka-backup', 'Turnir "' + turnir.postavke.naziv + '" je uvezen.', false);
  });
}
