// Stranica "Timovi": klubovi, te timovi sa govornicima.
// Dodavanje, uređivanje i brisanje. Pravila i spremanje su u participants.js.
//
// Ista forma služi i za dodavanje i za uređivanje:
// klik na "Uredi" popuni formu podacima, a dugme postane "Sačuvaj izmjene".

// Id kluba i tima koji se trenutno uređuju. Prazno = forma dodaje novi.
var uredjeniKlubId = '';
var uredjeniTimId = '';

function stranicaTimova() {
  uredjeniKlubId = '';
  uredjeniTimId = '';
  var turnir = ucitajTurnir();

  return (
    '<h1>Timovi</h1>' +
    '<div class="mreza-ucesnika">' +
      '<section class="kartica">' +
        '<h2>Klubovi</h2>' +
        '<p class="napomena">Klub ili škola kojoj pripadaju timovi i sudije. ' +
          'Timovi iz istog kluba se ne sparuju međusobno.</p>' +
        '<form id="forma-kluba" novalidate>' +
          '<label class="polje">Naziv kluba' +
            '<input type="text" name="nazivKluba" maxlength="' + NAJDUZI_NAZIV + '" autocomplete="off" ' +
              'placeholder="npr. Gimnazija Mostar" aria-describedby="greska-nazivKluba">' +
            mjestoZaGresku('nazivKluba') +
          '</label>' +
          dugmadForme('kluba', 'Dodaj klub') +
        '</form>' +
        '<div id="lista-klubova"></div>' +
      '</section>' +
      '<section class="kartica">' +
        '<h2 id="naslov-timova"></h2>' +
        '<p class="napomena">Format: ' + Formati[turnir.postavke.format].naziv + ', ' +
          brojGovornika(turnir) + ' govornika po timu. Najviše ' + NAJVISE_TIMOVA + ' timova.</p>' +
        '<form id="forma-tima" novalidate>' +
          '<div class="mreza-polja">' +
            '<label class="polje">Naziv tima' +
              '<input type="text" name="nazivTima" maxlength="' + NAJDUZI_NAZIV + '" autocomplete="off" ' +
                'placeholder="npr. Mostar A" aria-describedby="greska-nazivTima">' +
              mjestoZaGresku('nazivTima') +
            '</label>' +
            '<label class="polje">Klub' +
              '<select name="klubTima" aria-describedby="greska-klubTima"></select>' +
              mjestoZaGresku('klubTima') +
            '</label>' +
          '</div>' +
          '<div class="mreza-polja">' + poljaGovornika(brojGovornika(turnir)) + '</div>' +
          '<p id="napomena-tima" class="napomena" hidden></p>' +
          dugmadForme('tima', 'Dodaj tim') +
        '</form>' +
        '<div id="lista-timova"></div>' +
      '</section>' +
    '</div>'
  );
}

// Dugme za snimanje, dugme "Odustani" (vidljivo samo dok se uređuje) i mjesto za poruku.
// Koristi ga i stranica Sudije.
function dugmadForme(sta, tekstDugmeta) {
  return (
    '<div class="akcije">' +
      '<button type="submit" id="dugme-' + sta + '" class="dugme">' + tekstDugmeta + '</button>' +
      '<button type="button" id="odustani-' + sta + '" class="dugme dugme-sporedno" hidden>Odustani</button>' +
      '<span id="poruka-' + sta + '" class="poruka" role="status"></span>' +
    '</div>'
  );
}

function poljaGovornika(broj) {
  var html = '';
  for (var i = 1; i <= broj; i++) {
    html +=
      '<label class="polje">Govornik ' + i +
        '<input type="text" name="govornik' + i + '" maxlength="' + NAJDUZI_NAZIV + '" autocomplete="off" ' +
          'aria-describedby="greska-govornik' + i + '">' +
        mjestoZaGresku('govornik' + i) +
      '</label>';
  }
  return html;
}

// Opcije za padajući meni sa klubovima. Koristi ga i stranica Sudije.
// prvaOpcija je tekst prve, prazne opcije (npr. "— izaberi klub —").
function opcijeKlubova(turnir, odabraniId, prvaOpcija) {
  var html = '<option value="">' + prvaOpcija + '</option>';
  var klubovi = turnir.klubovi.slice().sort(function (a, b) {
    return a.naziv.localeCompare(b.naziv, 'bs');
  });
  for (var i = 0; i < klubovi.length; i++) {
    html +=
      '<option value="' + klubovi[i].id + '"' + (klubovi[i].id === odabraniId ? ' selected' : '') + '>' +
        sigurnoHtml(klubovi[i].naziv) +
      '</option>';
  }
  return html;
}

// Poziva se nakon što se stranica prikaže: povezuje dugmad sa funkcijama.
function pokreniTimove() {
  var formaKluba = document.getElementById('forma-kluba');
  var formaTima = document.getElementById('forma-tima');

  formaKluba.addEventListener('submit', function (dogadjaj) {
    dogadjaj.preventDefault();
    spremiKlub(formaKluba);
  });
  formaTima.addEventListener('submit', function (dogadjaj) {
    dogadjaj.preventDefault();
    spremiTim(formaTima);
  });

  document.getElementById('odustani-kluba').addEventListener('click', function () {
    zavrsiUredjivanjeKluba();
    prikaziPoruku('poruka-kluba', '', false);
  });
  document.getElementById('odustani-tima').addEventListener('click', function () {
    zavrsiUredjivanjeTima();
    prikaziPoruku('poruka-tima', '', false);
  });

  // Jedan osluškivač za sva dugmad "Uredi" i "Obriši" u listi.
  // Dugme u sebi nosi šta radi (data-akcija) i sa kim (data-id).
  document.getElementById('lista-klubova').addEventListener('click', function (dogadjaj) {
    var dugme = dogadjaj.target.closest('button[data-akcija]');
    if (!dugme) {
      return;
    }
    if (dugme.dataset.akcija === 'uredi') {
      urediKlub(dugme.dataset.id);
    } else {
      obrisiKlubKlikom(dugme.dataset.id);
    }
  });
  document.getElementById('lista-timova').addEventListener('click', function (dogadjaj) {
    var dugme = dogadjaj.target.closest('button[data-akcija]');
    if (!dugme) {
      return;
    }
    if (dugme.dataset.akcija === 'uredi') {
      urediTim(dugme.dataset.id);
    } else {
      obrisiTimKlikom(dugme.dataset.id);
    }
  });

  osvjeziTimove(ucitajTurnir());
}

// Ponovo nacrtaj liste i meni sa klubovima, nakon svake izmjene.
function osvjeziTimove(turnir) {
  var meni = document.getElementById('forma-tima').klubTima;
  var odabrani = meni.value;
  meni.innerHTML = opcijeKlubova(turnir, odabrani,
    turnir.klubovi.length ? '— izaberi klub —' : '— prvo dodaj klub —');

  document.getElementById('naslov-timova').textContent =
    'Timovi (' + turnir.timovi.length + ' / ' + NAJVISE_TIMOVA + ')';
  document.getElementById('lista-klubova').innerHTML = listaKlubova(turnir);
  document.getElementById('lista-timova').innerHTML = listaTimova(turnir);
}

function listaKlubova(turnir) {
  if (turnir.klubovi.length === 0) {
    return '<p class="napomena">Još nema klubova.</p>';
  }
  var html = '<ul class="lista">';
  poredajPoImenu(turnir.klubovi, 'naziv').forEach(function (klub) {
    var clanovi = clanoviKluba(turnir, klub.id);
    html += stavkaListe(
      klub.id,
      klub.id === uredjeniKlubId,
      '<strong>' + sigurnoHtml(klub.naziv) + '</strong>',
      '<span class="napomena">' + tekstBroja(clanovi.timova, 'tim', 'tima', 'timova') + ', ' +
        tekstBroja(clanovi.sudija, 'sudija', 'sudije', 'sudija') + '</span>'
    );
  });
  return html + '</ul>';
}

function listaTimova(turnir) {
  if (turnir.timovi.length === 0) {
    return '<p class="napomena">Još nema timova.</p>';
  }
  var potrebno = brojGovornika(turnir);
  var html = '<ul class="lista">';
  poredajPoImenu(turnir.timovi, 'naziv').forEach(function (tim) {
    var imena = tim.govornici.map(function (g) { return sigurnoHtml(g.ime); }).join(', ');
    var upozorenja = '';
    if (!tim.klubId) {
      upozorenja += '<span class="upozorenje">Tim nema klub. Klikni "Uredi" i izaberi klub.</span>';
    }
    if (tim.govornici.length !== potrebno) {
      upozorenja += '<span class="upozorenje">Tim ima ' + tim.govornici.length + ' govornika, a format traži ' +
        potrebno + '. Klikni "Uredi" i ispravi.</span>';
    }
    html += stavkaListe(
      tim.id,
      tim.id === uredjeniTimId,
      '<strong>' + sigurnoHtml(tim.naziv) + '</strong>' +
        (tim.klubId ? ' <span class="napomena">· ' + sigurnoHtml(nazivKluba(turnir, tim.klubId)) + '</span>' : ''),
      '<span>' + (imena || '<span class="napomena">bez govornika</span>') + '</span>' + upozorenja
    );
  });
  return html + '</ul>';
}

// Jedan red u listi: tekst lijevo, dugmad "Uredi" i "Obriši" desno.
// Koristi ga i stranica Sudije.
function stavkaListe(id, seUredjuje, naslov, detalji) {
  return (
    '<li class="stavka' + (seUredjuje ? ' uredjuje-se' : '') + '">' +
      '<div class="stavka-tekst">' +
        '<div>' + naslov + '</div>' +
        '<div class="stavka-detalji">' + detalji + '</div>' +
      '</div>' +
      '<div class="stavka-akcije">' +
        '<button type="button" class="dugme dugme-malo dugme-sporedno" data-akcija="uredi" data-id="' + id + '">Uredi</button>' +
        '<button type="button" class="dugme dugme-malo dugme-opasno" data-akcija="obrisi" data-id="' + id + '">Obriši</button>' +
      '</div>' +
    '</li>'
  );
}

// Kopija liste poredana po abecedi (lista u turniru ostaje kakva jeste).
function poredajPoImenu(lista, polje) {
  return lista.slice().sort(function (a, b) {
    return a[polje].localeCompare(b[polje], 'bs');
  });
}

// 1 tim, 2 tima, 5 timova (bosanska gramatika za brojeve).
function tekstBroja(broj, jedan, dvaDoCetiri, petIVise) {
  var zadnjaDva = broj % 100;
  var zadnja = broj % 10;
  var rijec = petIVise;
  if (zadnja === 1 && zadnjaDva !== 11) {
    rijec = jedan;
  } else if (zadnja >= 2 && zadnja <= 4 && (zadnjaDva < 12 || zadnjaDva > 14)) {
    rijec = dvaDoCetiri;
  }
  return broj + ' ' + rijec;
}

// ---- Klubovi ----

function spremiKlub(forma) {
  var turnir = ucitajTurnir();
  var naziv = forma.nazivKluba.value;
  if (prikaziGreske(forma, provjeriKlub(turnir, naziv, uredjeniKlubId))) {
    prikaziPoruku('poruka-kluba', '', false);
    return;
  }
  var bioNov = uredjeniKlubId === '';
  snimiKlub(turnir, uredjeniKlubId, naziv);
  if (!sacuvajTurnir(turnir)) {
    prikaziPoruku('poruka-kluba', 'Spremanje nije uspjelo.', true);
    return;
  }
  zavrsiUredjivanjeKluba(); // očisti formu i ponovo nacrta liste
  prikaziPoruku('poruka-kluba', 'Klub "' + naziv.trim() + '" je ' + (bioNov ? 'dodan.' : 'sačuvan.'), false);
  forma.nazivKluba.focus(); // odmah se može upisati sljedeći
}

function urediKlub(id) {
  var klub = nadjiPoId(ucitajTurnir().klubovi, id);
  if (!klub) {
    return;
  }
  var forma = document.getElementById('forma-kluba');
  uredjeniKlubId = id;
  forma.nazivKluba.value = klub.naziv;
  prikaziGreske(forma, {});
  postaviNacinForme('kluba', true, 'Dodaj klub');
  prikaziPoruku('poruka-kluba', '', false);
  osvjeziTimove(ucitajTurnir());
  forma.nazivKluba.focus();
}

function zavrsiUredjivanjeKluba() {
  var forma = document.getElementById('forma-kluba');
  uredjeniKlubId = '';
  forma.reset();
  prikaziGreske(forma, {});
  postaviNacinForme('kluba', false, 'Dodaj klub');
  osvjeziTimove(ucitajTurnir());
}

function obrisiKlubKlikom(id) {
  var turnir = ucitajTurnir();
  var klub = nadjiPoId(turnir.klubovi, id);
  if (!klub) {
    return;
  }
  var greska = obrisiKlub(turnir, id);
  if (greska) {
    prikaziPoruku('poruka-kluba', greska, true);
    return;
  }
  if (!confirm('Obrisati klub "' + klub.naziv + '"?')) {
    return;
  }
  sacuvajTurnir(turnir);
  if (id === uredjeniKlubId) {
    zavrsiUredjivanjeKluba();
  }
  osvjeziTimove(turnir);
  prikaziPoruku('poruka-kluba', 'Klub "' + klub.naziv + '" je obrisan.', false);
}

// ---- Timovi ----

function procitajTim(forma, broj) {
  var govornici = [];
  for (var i = 1; i <= broj; i++) {
    govornici.push(forma['govornik' + i].value);
  }
  return {
    naziv: forma.nazivTima.value,
    klubId: forma.klubTima.value,
    govornici: govornici
  };
}

function spremiTim(forma) {
  var turnir = ucitajTurnir();
  var bioNov = uredjeniTimId === '';

  if (bioNov && turnir.timovi.length >= NAJVISE_TIMOVA) {
    prikaziPoruku('poruka-tima', 'Turnir već ima ' + NAJVISE_TIMOVA + ' timova, što je najviše.', true);
    return;
  }

  var podaci = procitajTim(forma, brojGovornika(turnir));
  if (prikaziGreske(forma, provjeriTim(turnir, podaci, uredjeniTimId))) {
    prikaziPoruku('poruka-tima', '', false);
    return;
  }
  snimiTim(turnir, uredjeniTimId, podaci);
  if (!sacuvajTurnir(turnir)) {
    prikaziPoruku('poruka-tima', 'Spremanje nije uspjelo.', true);
    return;
  }
  zavrsiUredjivanjeTima();
  // Klub ostaje izabran, jer se timovi jednog kluba obično unose jedan za drugim.
  forma.klubTima.value = podaci.klubId;
  prikaziPoruku('poruka-tima', 'Tim "' + podaci.naziv.trim() + '" je ' + (bioNov ? 'dodan.' : 'sačuvan.'), false);
  forma.nazivTima.focus();
}

function urediTim(id) {
  var turnir = ucitajTurnir();
  var tim = nadjiPoId(turnir.timovi, id);
  if (!tim) {
    return;
  }
  var forma = document.getElementById('forma-tima');
  var broj = brojGovornika(turnir);
  uredjeniTimId = id;
  osvjeziTimove(turnir);

  forma.nazivTima.value = tim.naziv;
  forma.klubTima.value = tim.klubId;
  for (var i = 1; i <= broj; i++) {
    forma['govornik' + i].value = tim.govornici[i - 1] ? tim.govornici[i - 1].ime : '';
  }

  // Ako je format promijenjen nakon unosa, tim može imati previše govornika.
  var napomena = document.getElementById('napomena-tima');
  napomena.hidden = tim.govornici.length <= broj;
  napomena.textContent = 'Ovaj tim ima ' + tim.govornici.length + ' govornika, a format traži ' + broj +
    '. Kad sačuvaš, ostaju samo govornici upisani iznad.';

  prikaziGreske(forma, {});
  postaviNacinForme('tima', true, 'Dodaj tim');
  prikaziPoruku('poruka-tima', '', false);
  forma.scrollIntoView({ block: 'nearest' }); // na mobitelu je forma možda daleko iznad
  forma.nazivTima.focus();
}

function zavrsiUredjivanjeTima() {
  var forma = document.getElementById('forma-tima');
  uredjeniTimId = '';
  forma.reset();
  forma.klubTima.value = ''; // reset() bi vratio klub koji je bio izabran pri crtanju menija
  document.getElementById('napomena-tima').hidden = true;
  prikaziGreske(forma, {});
  postaviNacinForme('tima', false, 'Dodaj tim');
  osvjeziTimove(ucitajTurnir());
}

function obrisiTimKlikom(id) {
  var turnir = ucitajTurnir();
  var tim = nadjiPoId(turnir.timovi, id);
  if (!tim || !confirm('Obrisati tim "' + tim.naziv + '" i njegove govornike?')) {
    return;
  }
  obrisiTim(turnir, id);
  sacuvajTurnir(turnir);
  if (id === uredjeniTimId) {
    zavrsiUredjivanjeTima();
  }
  osvjeziTimove(turnir);
  prikaziPoruku('poruka-tima', 'Tim "' + tim.naziv + '" je obrisan.', false);
}

// Prebaci formu između "dodaj novi" i "uredi postojeći".
// Koristi ga i stranica Sudije.
function postaviNacinForme(sta, uredjuje, tekstDodaj) {
  document.getElementById('dugme-' + sta).textContent = uredjuje ? 'Sačuvaj izmjene' : tekstDodaj;
  document.getElementById('odustani-' + sta).hidden = !uredjuje;
}
