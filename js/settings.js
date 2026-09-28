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
          '<input type="text" name="naziv" maxlength="100" value="' + sigurnoHtml(p.naziv) + '" placeholder="npr. Kup Sarajeva 2026">' +
        '</label>' +
        '<label class="polje">Format' +
          '<select name="format">' + opcijeFormata + '</select>' +
        '</label>' +
        '<p id="opis-formata" class="napomena">' + Formati[p.format].opis + '</p>' +
        '<label class="polje">Broj preliminarnih rundi' +
          '<input type="number" name="brojRundi" min="' + NAJMANJE_RUNDI + '" max="' + NAJVISE_RUNDI + '" step="1" value="' + p.brojRundi + '">' +
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
    '</section>'
  );
}

// Polja "od" i "do" za svaki raspon bodova izabranog formata.
function poljaRaspona(formatKljuc, rasponi) {
  var format = Formati[formatKljuc];
  var html = '';
  for (var kljuc in format.rasponi) {
    html +=
      '<div class="raspon">' +
        '<span class="raspon-naziv">' + format.rasponi[kljuc].naziv + '</span>' +
        '<label>od <input type="number" name="' + kljuc + '-min" step="1" min="0" value="' + rasponi[kljuc].min + '"></label>' +
        '<label>do <input type="number" name="' + kljuc + '-max" step="1" min="0" value="' + rasponi[kljuc].max + '"></label>' +
      '</div>';
  }
  if (format.napomena) {
    html += '<p class="napomena">' + format.napomena + '</p>';
  }
  return html;
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
  var format = forma.format.value;
  var postavke = {
    naziv: forma.naziv.value.trim(),
    format: format,
    brojRundi: Number(forma.brojRundi.value),
    rasponi: {}
  };
  for (var kljuc in Formati[format].rasponi) {
    postavke.rasponi[kljuc] = {
      min: Number(forma[kljuc + '-min'].value),
      max: Number(forma[kljuc + '-max'].value)
    };
  }

  var greska = provjeriPostavke(postavke);
  if (greska) {
    prikaziPoruku('poruka-postavki', greska, true);
    return;
  }

  var turnir = ucitajTurnir();
  turnir.postavke = postavke;
  if (sacuvajTurnir(turnir)) {
    prikaziPoruku('poruka-postavki', 'Postavke su sačuvane.', false);
  } else {
    prikaziPoruku('poruka-postavki', 'Spremanje nije uspjelo. Browser možda ne dozvoljava spremanje podataka.', true);
  }
}

// Vraća tekst greške, ili prazan tekst ako je sve u redu.
function provjeriPostavke(p) {
  if (p.naziv === '') {
    return 'Upiši naziv turnira.';
  }
  if (!Number.isInteger(p.brojRundi) || p.brojRundi < NAJMANJE_RUNDI || p.brojRundi > NAJVISE_RUNDI) {
    return 'Broj rundi mora biti cijeli broj od ' + NAJMANJE_RUNDI + ' do ' + NAJVISE_RUNDI + '.';
  }
  for (var kljuc in p.rasponi) {
    var r = p.rasponi[kljuc];
    var naziv = Formati[p.format].rasponi[kljuc].naziv;
    if (!Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min < 0) {
      return naziv + ': upiši ispravne brojeve.';
    }
    if (r.min >= r.max) {
      return naziv + ': najmanji broj bodova mora biti manji od najvećeg.';
    }
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

function prikaziPoruku(id, tekst, jeGreska) {
  var element = document.getElementById(id);
  element.textContent = tekst;
  element.classList.toggle('greska', jeGreska);
  element.classList.toggle('uspjeh', !jeGreska);
}
