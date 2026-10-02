// Stranica "Runde": parovanje runde 1 i unos balota.
// Priprema (swing timovi, veličina panela), nacrt sa ručnim zamjenama, objava i balote.
// Pravila su u rounds.js, algoritam parovanja u pairing.js, a forma za balote u ballots-page.js.
//
// Ručna zamjena radi "klik pa klik": klikni na tim (ili sudiju), pa na drugi tim
// (ili sudiju). Njih dvoje zamijene mjesta. Radi jednako na laptopu i na mobitelu.

// Tim ili sudija koji je kliknut prvi i čeka drugi klik. null = ništa nije odabrano.
// Izgleda ovako: { vrsta: 'timovi', id: 't3' } ili { vrsta: 'sudije', id: 's2' }
var odabranoZaZamjenu = null;

// Veličina panela izabrana prije nego što nacrt postoji.
var izabraniPanel = ZADANI_PANEL;

function stranicaRundi() {
  odabranoZaZamjenu = null;
  sobaZaBalot = null;
  return (
    '<h1>Runde</h1>' +
    '<div id="runde-sadrzaj"></div>' +
    '<p class="napomena">Runde 2 i dalje (power pairing) dolaze u fazi 7.</p>'
  );
}

function pokreniRunde() {
  var sadrzaj = document.getElementById('runde-sadrzaj');

  // Jedan osluškivač za svu dugmad na stranici. Dugme nosi šta radi u data-akcija.
  sadrzaj.addEventListener('click', function (dogadjaj) {
    var dugme = dogadjaj.target.closest('button[data-akcija]');
    if (dugme && !dugme.disabled) {
      uradiAkciju(dugme);
    }
  });

  sadrzaj.addEventListener('change', function (dogadjaj) {
    if (dogadjaj.target.name === 'velicinaPanela') {
      promijeniPanel(Number(dogadjaj.target.value));
    }
  });

  // Forma za balote: dok se kuca, odmah se računa zbir; "Sačuvaj balot" je provjeri i spremi.
  sadrzaj.addEventListener('input', function (dogadjaj) {
    var forma = dogadjaj.target.closest('#forma-balota');
    if (forma) {
      prikaziPoruku('poruka-runde', '', false);
      ukloniGreskuPolja(dogadjaj.target);
      osvjeziZiviPrikaz(forma);
    }
  });

  sadrzaj.addEventListener('submit', function (dogadjaj) {
    if (dogadjaj.target.id === 'forma-balota') {
      dogadjaj.preventDefault();
      spremiBalot(dogadjaj.target);
    }
  });

  // Tipka Esc poništava odabir za zamjenu.
  sadrzaj.addEventListener('keydown', function (dogadjaj) {
    if (dogadjaj.key === 'Escape' && odabranoZaZamjenu) {
      odabranoZaZamjenu = null;
      osvjeziRunde('', false);
    }
  });

  osvjeziRunde('', false);
}

function uradiAkciju(dugme) {
  var akcija = dugme.dataset.akcija;
  if (akcija === 'odaberi') {
    odaberiZaZamjenu(dugme.dataset.vrsta, dugme.dataset.id);
  } else if (akcija === 'swing') {
    promijeniSwingTimove();
  } else if (akcija === 'generisi') {
    generisiKlikom();
  } else if (akcija === 'panel') {
    promijeniPanel(Number(dugme.dataset.velicina));
  } else if (akcija === 'objavi') {
    objaviKlikom();
  } else if (akcija === 'vrati') {
    vratiUNacrtKlikom();
  } else if (akcija === 'obrisi') {
    obrisiNacrtKlikom();
  } else if (akcija === 'balot') {
    otvoriBalot(Number(dugme.dataset.soba));
  } else if (akcija === 'zatvori-balot') {
    zatvoriBalot();
  }
}

// Ponovo nacrtaj cijelu stranicu i pokaži poruku (npr. "Nacrt je napravljen.").
function osvjeziRunde(poruka, jeGreska) {
  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  var html;
  if (!runda) {
    html = htmlPripreme(turnir);
  } else if (runda.status === 'nacrt') {
    html = htmlNacrta(turnir, runda);
  } else if (sobaZaBalot !== null && runda.sobe[sobaZaBalot]) {
    html = htmlFormeBalota(turnir, runda, sobaZaBalot);
  } else {
    html = htmlObjavljene(turnir, runda);
  }
  document.getElementById('runde-sadrzaj').innerHTML = html;
  if (poruka) {
    prikaziPoruku('poruka-runde', poruka, jeGreska);
  }
}

// ---- Dijelovi stranice ----

// Prije prvog parovanja: broj timova, swing timovi, panel i dugme "Generiši parove".
function htmlPripreme(turnir) {
  var format = Formati[turnir.postavke.format];
  var pravih = praviTimovi(turnir).length;
  var spremno = brojTimovaOdgovara(turnir);
  var brojSoba = (pravih + potrebnoSwingTimova(turnir)) / format.timovaPoSobi;

  var html =
    '<section class="kartica">' +
      '<h2>Runda 1 <span class="status">Još nije napravljena</span></h2>' +
      '<p>Format: ' + format.naziv + ', ' + format.timovaPoSobi + ' tima u sobi. ' +
        'Timova: ' + pravih + ', sudija: ' + turnir.sudije.length + '.</p>' +
      '<p class="napomena">Aplikacija nasumično napravi parove i dodijeli sudije, pazeći da se timovi ' +
        'iz istog kluba ne sretnu i da sudija ne sudi timu iz svog kluba. ' +
        'Nakon toga parove i sudije možeš ručno zamijeniti, pa objaviti rundu.</p>';

  if (pravih < NAJMANJE_PRAVIH_TIMOVA) {
    html += '<p class="upozorenje">Za parovanje trebaju barem ' + NAJMANJE_PRAVIH_TIMOVA +
      ' tima. Dodaj timove na stranici <a href="#/timovi">Timovi</a>.</p>';
  } else {
    html += htmlSwingTimova(turnir);
    html += poljePanela(izabraniPanel) + htmlUpozorenjaPanela(turnir.sudije.length, brojSoba, izabraniPanel);
  }

  html +=
      '<div class="akcije">' +
        '<button type="button" class="dugme" data-akcija="generisi"' + (spremno ? '' : ' disabled') + '>Generiši parove</button>' +
        '<span id="poruka-runde" class="poruka" role="status"></span>' +
      '</div>' +
    '</section>';
  return html;
}

// Nacrt: sve se može mijenjati i ponovo generisati.
function htmlNacrta(turnir, runda) {
  var zastarjelo = razloziZastarjelosti(turnir, runda);
  var crvenih = brojCrvenihOznaka(turnir, runda);

  var html =
    '<section class="kartica">' +
      '<h2>Runda 1 <span class="status status-nacrt">Nacrt</span></h2>' +
      '<p class="napomena">Nacrt vidiš samo ti. Dok je runda nacrt, možeš mijenjati parove i sudije ' +
        'ili sve ponovo generisati. Kad je sve spremno, objavi rundu.</p>';

  if (zastarjelo.length > 0) {
    html += '<div class="upozorenje-okvir"><strong>Nacrt više ne odgovara timovima i sudijama.</strong>' +
      listaTeksta(zastarjelo) + 'Klikni "Generiši ponovo".</div>';
    html += htmlSwingTimova(turnir);
  }

  html += poljePanela(runda.velicinaPanela) +
    htmlUpozorenjaPanela(turnir.sudije.length, runda.sobe.length, runda.velicinaPanela);

  if (crvenih > 0) {
    html += '<p class="oznaka-crvena">' + tekstBroja(crvenih, 'crvena oznaka', 'crvene oznake', 'crvenih oznaka') +
      ': ove probleme nije bilo moguće izbjeći (ili su nastali ručnom zamjenom).</p>';
  }

  html +=
      '<div class="akcije">' +
        '<button type="button" class="dugme" data-akcija="objavi">Objavi rundu</button>' +
        '<button type="button" class="dugme dugme-sporedno" data-akcija="generisi">Generiši ponovo</button>' +
        '<button type="button" class="dugme dugme-opasno" data-akcija="obrisi">Obriši nacrt</button>' +
        '<span id="poruka-runde" class="poruka" role="status"></span>' +
      '</div>' +
      '<p class="napomena">Ručna zamjena: klikni na tim, pa na drugi tim, i oni zamijene mjesta ' +
        '(u istoj sobi to znači zamjenu strana). Isto važi za sudije, i za slobodne sudije ispod soba. ' +
        'Drugi klik na isti tim (ili tipka Esc) poništava odabir.</p>' +
    '</section>' +
    htmlSoba(turnir, runda, true);
  return html;
}

// Objavljena runda: pregled i unos balota. Može se vratiti u nacrt.
function htmlObjavljene(turnir, runda) {
  var unesenih = brojUnesenihSoba(runda);
  return (
    '<section class="kartica">' +
      '<h2>Runda 1 <span class="status status-objavljena">Objavljena</span></h2>' +
      '<p>Panel: ' + tekstBroja(runda.velicinaPanela, 'sudija', 'sudije', 'sudija') + ' po sobi. ' +
        'Timovi i sudije iz ove runde se ne mogu obrisati.</p>' +
      '<p><strong>Balote:</strong> unesene za ' + unesenih + ' od ' +
        tekstBroja(runda.sobe.length, 'sobe', 'sobe', 'soba') + '.' +
        (unesenih < runda.sobe.length ? ' Klikni "Unesi balot" kod sobe.' : ' Sve sobe su unesene.') + '</p>' +
      '<div class="akcije">' +
        '<button type="button" class="dugme dugme-sporedno" data-akcija="vrati">Vrati u nacrt</button>' +
        '<span id="poruka-runde" class="poruka" role="status"></span>' +
      '</div>' +
    '</section>' +
    htmlSoba(turnir, runda, false)
  );
}

// Swing timovi: prijedlog da se dodaju (ili uklone) i spisak postojećih.
function htmlSwingTimova(turnir) {
  var format = Formati[turnir.postavke.format];
  var pravih = praviTimovi(turnir).length;
  var potrebno = potrebnoSwingTimova(turnir);
  var postojeci = swingTimovi(turnir);
  var html = '';

  if (potrebno > postojeci.length) {
    var pravilo = format.timovaPoSobi === 2 ?
      'je neparan, a ' + format.kratkiNaziv + ' traži paran broj timova' :
      'nije djeljiv sa 4, a ' + format.kratkiNaziv + ' traži 4 tima u sobi';
    var dodati = potrebno - postojeci.length;
    html += '<div class="upozorenje-okvir">Broj timova (' + pravih + ') ' + pravilo + '. ' +
      'Predlaže se dodavanje ' + tekstBroja(dodati, 'swing tima', 'swing tima', 'swing timova') +
      ': tim sastavljen od rezervnih govornika, koji ne ulazi u poredak.' +
      '<div class="akcije"><button type="button" class="dugme" data-akcija="swing">' +
        (dodati === 1 ? 'Dodaj swing tim' : 'Dodaj ' + dodati + ' swing tima') + '</button></div></div>';
  } else if (potrebno < postojeci.length) {
    var ukloniti = postojeci.length - potrebno;
    html += '<div class="upozorenje-okvir">' +
      (potrebno === 0 ? 'Swing timovi više nisu potrebni' : 'Ima više swing timova nego što treba') +
      ' (timova: ' + pravih + ').' +
      '<div class="akcije"><button type="button" class="dugme" data-akcija="swing">' +
        (ukloniti === 1 ? 'Ukloni swing tim' : 'Ukloni ' + ukloniti + ' swing tima') + '</button></div></div>';
  }

  if (postojeci.length > 0) {
    html += '<p class="napomena">Swing timovi: ' + postojeci.map(function (t) {
      return sigurnoHtml(t.naziv) + ' (' + t.govornici.map(function (g) { return sigurnoHtml(g.ime); }).join(', ') + ')';
    }).join('; ') + '.</p>';
  }
  return html;
}

function poljePanela(odabrana) {
  var opcije = VELICINE_PANELA.map(function (v) {
    return '<option value="' + v + '"' + (v === odabrana ? ' selected' : '') + '>' +
      tekstBroja(v, 'sudija', 'sudije', 'sudija') + '</option>';
  }).join('');
  return (
    '<label class="polje polje-panela">Veličina panela (sudija po sobi)' +
      '<select name="velicinaPanela">' + opcije + '</select>' +
    '</label>'
  );
}

// Upozorenje ako nema dovoljno sudija za izabrani panel u svim sobama,
// sa dugmetom koje predloži manji panel.
function htmlUpozorenjaPanela(brojSudija, brojSoba, velicina) {
  var potrebno = velicina * brojSoba;
  if (brojSoba === 0 || brojSudija >= potrebno) {
    return '';
  }
  var html = '<div class="upozorenje-okvir">Za panel od ' + tekstBroja(velicina, 'sudije', 'sudije', 'sudija') +
    ' u ' + tekstBroja(brojSoba, 'sobi', 'sobe', 'soba') + ' treba ' + tekstBroja(potrebno, 'sudija', 'sudije', 'sudija') +
    ', a ima ih ' + brojSudija + '. ';
  var manji = najveciMoguciPanel(brojSudija, brojSoba);
  if (manji > 0) {
    html += 'Predlaže se manji panel.' +
      '<div class="akcije"><button type="button" class="dugme" data-akcija="panel" data-velicina="' + manji + '">' +
        'Koristi panel od ' + tekstBroja(manji, 'sudije', 'sudije', 'sudija') + '</button></div>';
  } else {
    html += 'Nema dovoljno sudija ni za po jednog u svakoj sobi. ' +
      'Dodaj sudije na stranici <a href="#/sudije">Sudije</a>.';
  }
  return html + '</div>';
}

// Sve sobe runde, pa slobodne sudije.
function htmlSoba(turnir, runda, uredjivo) {
  var html = '<div class="mreza-soba">';
  runda.sobe.forEach(function (soba, indeks) {
    html += htmlSobe(turnir, runda, soba, indeks, uredjivo);
  });
  html += '</div>';

  var slobodne = slobodneSudije(turnir, runda);
  if (slobodne.length > 0) {
    html += '<section class="kartica"><h2>Slobodne sudije (' + slobodne.length + ')</h2>' +
      '<p class="napomena">Nisu dodijeljene nijednoj sobi.' +
        (uredjivo ? ' Klikni na slobodnog sudiju, pa na sudiju u sobi, da ih zamijeniš.' : '') + '</p>' +
      '<div class="cipovi">' +
        slobodne.map(function (s) { return cipSudije(turnir, s.id, false, uredjivo); }).join('') +
      '</div></section>';
  }
  return html;
}

function htmlSobe(turnir, runda, soba, indeks, uredjivo) {
  var oznake = oznakeSobe(turnir, soba);
  var imaProblem = oznake.istiKlub.length > 0 || oznake.konflikti.length > 0;
  var nazivi = pozicije(turnir);

  var html = '<article class="soba' + (imaProblem ? ' soba-problem' : '') + '">' +
    '<h3>Soba ' + (indeks + 1) + '</h3>';
  oznake.istiKlub.forEach(function (klub) {
    html += '<p class="oznaka-crvena">Timovi iz istog kluba: ' + sigurnoHtml(klub) + '</p>';
  });

  html += '<dl class="pozicije">';
  soba.timovi.forEach(function (id, mjesto) {
    html += '<dt>' + (nazivi[mjesto] || 'Pozicija ' + (mjesto + 1)) + '</dt>' +
      '<dd>' + cipTima(turnir, id, uredjivo) + '</dd>';
  });
  html += '</dl>';

  html += '<div class="panel-sudija"><span class="panel-naslov">Sudije</span><div class="cipovi">';
  soba.sudije.forEach(function (id) {
    html += cipSudije(turnir, id, oznake.konflikti.indexOf(id) !== -1, uredjivo);
  });
  if (soba.sudije.length === 0) {
    html += '<span class="upozorenje">Nema sudije.</span>';
  }
  html += '</div>';
  if (soba.sudije.length > 0 && soba.sudije.length < runda.velicinaPanela) {
    html += '<span class="upozorenje">Nedostaje ' +
      tekstBroja(runda.velicinaPanela - soba.sudije.length, 'sudija', 'sudije', 'sudija') + ' za pun panel.</span>';
  }
  html += '</div>';
  if (runda.status === 'objavljena') {
    html += htmlStatusaBalota(turnir, soba, indeks);
  }
  return html + '</article>';
}

// Ispod sobe u objavljenoj rundi: "Nije uneseno" / "Uneseno" sa rezultatom i dugme za unos.
function htmlStatusaBalota(turnir, soba, indeks) {
  var html = '<div class="balot-sobe"><span class="panel-naslov">Balot</span>' + oznakaStatusaBalota(Boolean(soba.rezultat));
  if (soba.rezultat) {
    html += '<p class="rezultat-sobe">Rezultat: ' +
      sigurnoHtml(opisRezultata(turnir, soba, rezultatSobe(turnir, soba, soba.rezultat))) + '</p>';
  }
  return html + '<div class="akcije"><button type="button" class="dugme dugme-malo" data-akcija="balot" data-soba="' + indeks + '">' +
    (soba.rezultat ? 'Uredi balot' : 'Unesi balot') + '</button></div></div>';
}

function cipTima(turnir, id, uredjivo) {
  var tim = nadjiPoId(turnir.timovi, id);
  if (!tim) {
    return cip('timovi', id, 'Obrisan tim', '', true, uredjivo);
  }
  var detalj = tim.swing ? 'swing tim' : (tim.klubId ? nazivKluba(turnir, tim.klubId) : 'bez kluba');
  return cip('timovi', id, tim.naziv, detalj, false, uredjivo);
}

function cipSudije(turnir, id, konflikt, uredjivo) {
  var sudija = nadjiPoId(turnir.sudije, id);
  if (!sudija) {
    return cip('sudije', id, 'Obrisan sudija', '', true, uredjivo);
  }
  var klub = sudija.klubId ? nazivKluba(turnir, sudija.klubId) : 'nezavisni';
  return cip('sudije', id, sudija.ime, konflikt ? 'Konflikt: ' + klub : klub, konflikt, uredjivo);
}

// Jedan "čip": ime i ispod njega klub. U nacrtu je dugme (za zamjenu), inače običan tekst.
// crveno: crvena oznaka (konflikt ili nešto obrisano).
function cip(vrsta, id, ime, detalj, crveno, uredjivo) {
  var odabran = uredjivo && odabranoZaZamjenu !== null &&
    odabranoZaZamjenu.vrsta === vrsta && odabranoZaZamjenu.id === id;
  var klase = 'cip' + (crveno ? ' cip-konflikt' : '') + (odabran ? ' cip-odabran' : '');
  var sadrzaj = '<span class="cip-ime">' + sigurnoHtml(ime) + '</span>' +
    (detalj ? '<span class="cip-detalj">' + sigurnoHtml(detalj) + '</span>' : '');
  if (!uredjivo) {
    return '<span class="' + klase + '">' + sadrzaj + '</span>';
  }
  return '<button type="button" class="' + klase + '" data-akcija="odaberi" data-vrsta="' + vrsta + '" ' +
    'data-id="' + sigurnoHtml(id) + '" aria-pressed="' + odabran + '">' + sadrzaj + '</button>';
}

function listaTeksta(stavke) {
  return '<ul>' + stavke.map(function (s) { return '<li>' + sigurnoHtml(s) + '</li>'; }).join('') + '</ul>';
}

// ---- Akcije ----

function promijeniSwingTimove() {
  var turnir = ucitajTurnir();
  var prije = swingTimovi(turnir).length;
  uskladiSwingTimove(turnir);
  var poslije = swingTimovi(turnir).length;
  if (!sacuvajTurnir(turnir)) {
    osvjeziRunde('Spremanje nije uspjelo.', true);
    return;
  }
  osvjeziRunde(poslije > prije ?
    'Dodano: ' + tekstBroja(poslije - prije, 'swing tim', 'swing tima', 'swing timova') + '.' :
    'Uklonjeno: ' + tekstBroja(prije - poslije, 'swing tim', 'swing tima', 'swing timova') + '.', false);
}

function generisiKlikom() {
  var turnir = ucitajTurnir();
  if (!brojTimovaOdgovara(turnir)) {
    osvjeziRunde('Broj timova ne odgovara formatu. Prvo uskladi swing timove.', true);
    return;
  }
  var postojeca = nadjiRundu(turnir, 1);
  if (postojeca && !confirm('Novi nacrt će zamijeniti trenutni, zajedno sa ručnim izmjenama. Nastaviti?')) {
    return;
  }
  var panel = postojeca ? postojeca.velicinaPanela : izabraniPanel;
  var runda = generisiRundu1(turnir, panel);
  odabranoZaZamjenu = null;
  if (!sacuvajTurnir(turnir)) {
    osvjeziRunde('Spremanje nije uspjelo.', true);
    return;
  }
  var crvenih = brojCrvenihOznaka(turnir, runda);
  osvjeziRunde('Nacrt runde 1 je napravljen.' + (crvenih > 0 ?
    ' Nije bilo moguće izbjeći sve probleme: ' + tekstBroja(crvenih, 'crvena oznaka', 'crvene oznake', 'crvenih oznaka') + '.' : ''),
    false);
}

// Promjena veličine panela. Ako nacrt postoji, sudije se odmah ponovo dodijele.
function promijeniPanel(velicina) {
  if (VELICINE_PANELA.indexOf(velicina) === -1) {
    return;
  }
  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  if (!runda) {
    izabraniPanel = velicina;
    osvjeziRunde('', false);
    return;
  }
  if (runda.status !== 'nacrt') {
    return;
  }
  runda.velicinaPanela = velicina;
  dodijeliSudijeRundi(turnir, runda);
  odabranoZaZamjenu = null;
  sacuvajTurnir(turnir);
  osvjeziRunde('Sudije su ponovo dodijeljene za panel od ' +
    tekstBroja(velicina, 'sudije', 'sudije', 'sudija') + '.', false);
}

// Prvi klik odabere tim ili sudiju, drugi klik (na istu vrstu) zamijeni njih dvoje.
function odaberiZaZamjenu(vrsta, id) {
  var prvi = odabranoZaZamjenu;
  if (!prvi || prvi.vrsta !== vrsta) {
    odabranoZaZamjenu = { vrsta: vrsta, id: id };
    osvjeziRunde(vrsta === 'timovi' ? 'Sada klikni na tim sa kojim ga želiš zamijeniti.' :
      'Sada klikni na sudiju sa kojim ga želiš zamijeniti.', false);
    return;
  }
  odabranoZaZamjenu = null;
  if (prvi.id === id) {
    osvjeziRunde('Odabir je poništen.', false);
    return;
  }

  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  if (!runda || runda.status !== 'nacrt') {
    return;
  }
  if (vrsta === 'timovi') {
    zamijeniTimove(runda, prvi.id, id);
  } else if (!nadjiMjesto(runda, 'sudije', prvi.id) && !nadjiMjesto(runda, 'sudije', id)) {
    osvjeziRunde('Oba sudije su slobodna. Klikni na sudiju koji je u sobi.', true);
    return;
  } else {
    zamijeniSudije(runda, prvi.id, id);
  }
  sacuvajTurnir(turnir);
  osvjeziRunde('Zamijenjeno: ' + imeUcesnika(turnir, vrsta, prvi.id) + ' ↔ ' + imeUcesnika(turnir, vrsta, id) + '.', false);
}

function imeUcesnika(turnir, vrsta, id) {
  var ucesnik = nadjiPoId(turnir[vrsta], id);
  if (!ucesnik) {
    return '?';
  }
  return vrsta === 'timovi' ? ucesnik.naziv : ucesnik.ime;
}

function objaviKlikom() {
  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  var prepreke = preprekeZaObjavu(turnir, runda);
  if (prepreke.length > 0) {
    osvjeziRunde('Runda se ne može objaviti: ' + prepreke.join(' '), true);
    return;
  }
  var crvenih = brojCrvenihOznaka(turnir, runda);
  if (crvenih > 0 && !confirm('Runda ima ' + tekstBroja(crvenih, 'crvenu oznaku', 'crvene oznake', 'crvenih oznaka') +
      ' (isti klub ili konflikt sudije). Objaviti svejedno?')) {
    return;
  }
  runda.status = 'objavljena';
  odabranoZaZamjenu = null;
  sacuvajTurnir(turnir);
  osvjeziRunde('Runda 1 je objavljena.', false);
}

function vratiUNacrtKlikom() {
  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  var unesenih = brojUnesenihSoba(runda);
  // U nacrtu se timovi i sudije mogu zamijeniti, pa unesene balote više ne bi odgovarale sobama.
  var pitanje = 'Vratiti rundu 1 u nacrt? Parovi ostaju, ali se ponovo mogu mijenjati.' +
    (unesenih > 0 ? '\n\nPAŽNJA: unesene balote (' + tekstBroja(unesenih, 'soba', 'sobe', 'soba') + ') će biti obrisane.' : '');
  if (!confirm(pitanje)) {
    return;
  }
  obrisiBaloteRunde(runda);
  runda.status = 'nacrt';
  sacuvajTurnir(turnir);
  osvjeziRunde('Runda 1 je ponovo nacrt.', false);
}

function obrisiNacrtKlikom() {
  if (!confirm('Obrisati nacrt runde 1? Parovi i dodjela sudija se brišu.')) {
    return;
  }
  var turnir = ucitajTurnir();
  turnir.runde = turnir.runde.filter(function (r) { return r.broj !== 1; });
  odabranoZaZamjenu = null;
  sacuvajTurnir(turnir);
  osvjeziRunde('Nacrt je obrisan.', false);
}
