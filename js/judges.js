// Stranica "Sudije": sudije i klub kojem pripadaju.
// Dodavanje, uređivanje i brisanje. Pravila i spremanje su u participants.js.
// Koristi i pomoćne funkcije iz teams.js (opcijeKlubova, dugmadForme,
// stavkaListe, poredajPoImenu, postaviNacinForme).

// Id sudije koji se trenutno uređuje. Prazno = forma dodaje novog.
var uredjeniSudijaId = '';

// Pretpostavka: sudija ne mora imati klub (nezavisni sudija).
var BEZ_KLUBA = '— bez kluba (nezavisni) —';

function stranicaSudija() {
  uredjeniSudijaId = '';
  return (
    '<h1>Sudije</h1>' +
    '<div class="mreza-ucesnika">' +
      '<section class="kartica">' +
        '<h2>Dodaj sudiju</h2>' +
        '<p class="napomena">Sudija ne smije suditi timu iz svog kluba. ' +
          'Klubovi se dodaju na stranici <a href="#/timovi">Timovi</a>.</p>' +
        '<form id="forma-sudije" novalidate>' +
          '<label class="polje">Ime i prezime' +
            '<input type="text" name="imeSudije" maxlength="' + NAJDUZI_NAZIV + '" autocomplete="off" ' +
              'placeholder="npr. Lejla Hodžić" aria-describedby="greska-imeSudije">' +
            mjestoZaGresku('imeSudije') +
          '</label>' +
          '<label class="polje">Klub' +
            '<select name="klubSudije" aria-describedby="greska-klubSudije"></select>' +
            mjestoZaGresku('klubSudije') +
          '</label>' +
          dugmadForme('sudije', 'Dodaj sudiju') +
        '</form>' +
      '</section>' +
      '<section class="kartica">' +
        '<h2 id="naslov-sudija"></h2>' +
        '<div id="lista-sudija"></div>' +
      '</section>' +
    '</div>'
  );
}

function pokreniSudije() {
  var forma = document.getElementById('forma-sudije');

  forma.addEventListener('submit', function (dogadjaj) {
    dogadjaj.preventDefault();
    spremiSudiju(forma);
  });

  document.getElementById('odustani-sudije').addEventListener('click', function () {
    zavrsiUredjivanjeSudije();
    prikaziPoruku('poruka-sudije', '', false);
  });

  // Jedan osluškivač za sva dugmad "Uredi" i "Obriši" u listi.
  document.getElementById('lista-sudija').addEventListener('click', function (dogadjaj) {
    var dugme = dogadjaj.target.closest('button[data-akcija]');
    if (!dugme) {
      return;
    }
    if (dugme.dataset.akcija === 'uredi') {
      urediSudiju(dugme.dataset.id);
    } else {
      obrisiSudijuKlikom(dugme.dataset.id);
    }
  });

  osvjeziSudije(ucitajTurnir());
}

function osvjeziSudije(turnir) {
  var meni = document.getElementById('forma-sudije').klubSudije;
  meni.innerHTML = opcijeKlubova(turnir, meni.value, BEZ_KLUBA);
  document.getElementById('naslov-sudija').textContent = 'Sudije (' + turnir.sudije.length + ')';
  document.getElementById('lista-sudija').innerHTML = listaSudija(turnir);
}

function listaSudija(turnir) {
  if (turnir.sudije.length === 0) {
    return '<p class="napomena">Još nema sudija.</p>';
  }
  var html = '<ul class="lista">';
  poredajPoImenu(turnir.sudije, 'ime').forEach(function (sudija) {
    html += stavkaListe(
      sudija.id,
      sudija.id === uredjeniSudijaId,
      '<strong>' + sigurnoHtml(sudija.ime) + '</strong>',
      '<span class="napomena">' +
        (sudija.klubId ? sigurnoHtml(nazivKluba(turnir, sudija.klubId)) : 'nezavisni sudija') +
      '</span>'
    );
  });
  return html + '</ul>';
}

function spremiSudiju(forma) {
  var turnir = ucitajTurnir();
  var bioNov = uredjeniSudijaId === '';
  var podaci = { ime: forma.imeSudije.value, klubId: forma.klubSudije.value };

  if (prikaziGreske(forma, provjeriSudiju(turnir, podaci, uredjeniSudijaId))) {
    prikaziPoruku('poruka-sudije', '', false);
    return;
  }
  snimiSudiju(turnir, uredjeniSudijaId, podaci);
  if (!sacuvajTurnir(turnir)) {
    prikaziPoruku('poruka-sudije', 'Spremanje nije uspjelo.', true);
    return;
  }
  zavrsiUredjivanjeSudije();
  prikaziPoruku('poruka-sudije', 'Sudija "' + podaci.ime.trim() + '" je ' + (bioNov ? 'dodan.' : 'sačuvan.'), false);
  forma.imeSudije.focus(); // odmah se može upisati sljedeći
}

function urediSudiju(id) {
  var turnir = ucitajTurnir();
  var sudija = nadjiPoId(turnir.sudije, id);
  if (!sudija) {
    return;
  }
  var forma = document.getElementById('forma-sudije');
  uredjeniSudijaId = id;
  osvjeziSudije(turnir);
  forma.imeSudije.value = sudija.ime;
  forma.klubSudije.value = sudija.klubId;
  prikaziGreske(forma, {});
  postaviNacinForme('sudije', true, 'Dodaj sudiju');
  prikaziPoruku('poruka-sudije', '', false);
  forma.scrollIntoView({ block: 'nearest' });
  forma.imeSudije.focus();
}

function zavrsiUredjivanjeSudije() {
  var forma = document.getElementById('forma-sudije');
  uredjeniSudijaId = '';
  forma.reset();
  forma.klubSudije.value = ''; // reset() bi vratio klub koji je bio izabran pri crtanju menija
  prikaziGreske(forma, {});
  postaviNacinForme('sudije', false, 'Dodaj sudiju');
  osvjeziSudije(ucitajTurnir());
}

function obrisiSudijuKlikom(id) {
  var turnir = ucitajTurnir();
  var sudija = nadjiPoId(turnir.sudije, id);
  if (!sudija || !confirm('Obrisati sudiju "' + sudija.ime + '"?')) {
    return;
  }
  obrisiSudiju(turnir, id);
  sacuvajTurnir(turnir);
  if (id === uredjeniSudijaId) {
    zavrsiUredjivanjeSudije();
  }
  osvjeziSudije(turnir);
  prikaziPoruku('poruka-sudije', 'Sudija "' + sudija.ime + '" je obrisan.', false);
}
