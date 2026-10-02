// Stranica "Tab": poredak timova, govornika i (kod WSDC-a) replika.
// Računanje je u tab.js. Stranica samo prikazuje, ništa se ne mijenja.

function stranicaTaba() {
  var turnir = ucitajTurnir();
  var stanje = stanjeRundi(turnir);
  var runde = stanje.uracunate;

  var html = '<h1>Tab</h1>' + htmlStanjaRundi(stanje);
  if (runde.length === 0) {
    return html;
  }

  html += htmlTabeleTimova(turnir, runde) + htmlTabeleGovornika(turnir, runde);
  if (imaRepliku(turnir)) {
    html += htmlTabeleReplika(turnir, runde);
  }
  return html;
}

// Koje runde su uračunate, i upozorenje za runde kojima nedostaju sudijski listići.
function htmlStanjaRundi(stanje) {
  var html = '<section class="kartica">';
  if (stanje.uracunate.length > 0) {
    html += '<p><strong>Uračunate runde:</strong> ' +
      stanje.uracunate.map(function (r) { return r.broj; }).join(', ') + '.</p>';
  } else {
    html += '<p>Još nema nijedne runde sa svim unesenim sudijskim listićima. ' +
      'Poredak se pojavi čim se za neku objavljenu rundu unesu sudijski listići svih soba ' +
      '(stranica <a href="#/runde">Runde</a>).</p>';
  }
  stanje.nepotpune.forEach(function (n) {
    html += '<div class="upozorenje-okvir"><strong>Runda ' + n.broj + ' nije uračunata u tab.</strong> ' +
      'Nedostaju sudijski listići za ' + (n.sobe.length === 1 ? 'sobu ' : 'sobe ') + spojiBrojeve(n.sobe) + '.</div>';
  });
  if (stanje.nacrti.length > 0) {
    html += '<p class="napomena">' + (stanje.nacrti.length === 1 ? 'Runda ' : 'Runde ') + spojiBrojeve(stanje.nacrti) +
      (stanje.nacrti.length === 1 ? ' je još nacrt i ne ulazi' : ' su još nacrt i ne ulaze') + ' u tab.</p>';
  }
  return html + '</section>';
}

// [2] -> "2", [2, 4] -> "2 i 4", [1, 2, 4] -> "1, 2 i 4"
function spojiBrojeve(brojevi) {
  if (brojevi.length === 1) {
    return String(brojevi[0]);
  }
  return brojevi.slice(0, -1).join(', ') + ' i ' + brojevi[brojevi.length - 1];
}

function htmlTabeleTimova(turnir, runde) {
  var kriteriji = Formati[turnir.postavke.format].kriterijiTimova;
  var redovi = poredakTimova(turnir, runde);
  var opis = kriteriji.map(function (k) { return KRITERIJI_TIMOVA[k].toLowerCase(); }).join(' → ');
  if (imaRepliku(turnir)) {
    opis += turnir.postavke.replikaUBodoveTima ? ' (sa replikama)' : ' (bez replika)';
  }

  var html = '<section class="kartica"><h2>Poredak timova</h2>' +
    '<p class="napomena">Kriteriji, redom: ' + opis + '. Timovi izjednačeni po svim kriterijima dijele mjesto. ' +
      'Swing timovi ne ulaze u poredak.</p>' +
    '<div class="okvir-tabele"><table class="tabela"><thead><tr>' +
      '<th class="broj">Mjesto</th><th>Tim</th><th>Klub</th>' +
      kriteriji.map(function (k) { return '<th class="broj">' + KRITERIJI_TIMOVA[k] + '</th>'; }).join('') +
    '</tr></thead><tbody>';
  redovi.forEach(function (r) {
    html += '<tr><td class="broj">' + r.mjesto + '</td>' +
      '<td>' + sigurnoHtml(r.tim.naziv) + '</td>' +
      '<td>' + sigurnoHtml(nazivKluba(turnir, r.tim.klubId) || 'bez kluba') + '</td>' +
      kriteriji.map(function (k) { return '<td class="broj">' + tekstBodova(r[k]) + '</td>'; }).join('') +
      '</tr>';
  });
  return html + '</tbody></table></div></section>';
}

function htmlTabeleGovornika(turnir, runde) {
  return '<section class="kartica"><h2>Poredak govornika</h2>' +
    '<p class="napomena">Po ukupnim bodovima kroz sve uračunate runde (u svakoj rundi bod je prosjek sudija u sobi). ' +
      'Govornici sa istim ukupnim bodovima dijele mjesto. ' +
      (imaRepliku(turnir) ? 'Replike nisu uračunate; one su u tabeli "Replike". ' : '') +
      'Govornici swing timova ne ulaze u poredak.</p>' +
    htmlTabeleGovora(poredakGovornika(turnir, runde), runde, 'Govora') +
    '</section>';
}

function htmlTabeleReplika(turnir, runde) {
  var redovi = poredakReplika(turnir, runde);
  var poProsjeku = turnir.postavke.poredakReplika !== 'ukupno';
  return '<section class="kartica"><h2>Replike</h2>' +
    '<p class="napomena">Bodovi replika, odvojeno od glavnih govora. Poredak ' +
      (poProsjeku ? 'po prosjeku replika' : 'po ukupnim bodovima replika') + ' (može se promijeniti u ' +
      '<a href="#/postavke">Postavkama</a>). Govornici sa istim ' + (poProsjeku ? 'prosjekom' : 'zbirom') + ' dijele mjesto.</p>' +
    (redovi.length > 0 ? htmlTabeleGovora(redovi, runde, 'Replika') : '<p>Nema unesenih replika.</p>') +
    '</section>';
}

// Tabela govornika ili replika: bodovi po rundama, ukupno, broj govora i prosjek.
function htmlTabeleGovora(redovi, runde, nazivBroja) {
  var html = '<div class="okvir-tabele"><table class="tabela"><thead><tr>' +
    '<th class="broj">Mjesto</th><th>Govornik</th><th>Tim</th>' +
    runde.map(function (r) { return '<th class="broj" title="Runda ' + r.broj + '">R' + r.broj + '</th>'; }).join('') +
    '<th class="broj">Ukupno</th><th class="broj">' + nazivBroja + '</th><th class="broj">Prosjek</th>' +
    '</tr></thead><tbody>';
  redovi.forEach(function (r) {
    html += '<tr><td class="broj">' + r.mjesto + '</td>' +
      '<td>' + sigurnoHtml(r.govornik.ime) + '</td>' +
      '<td>' + sigurnoHtml(r.tim.naziv) + '</td>' +
      runde.map(function (runda) {
        var bod = r.poRundama[runda.broj];
        return '<td class="broj">' + (bod === undefined ? '—' : tekstBodova(bod)) + '</td>';
      }).join('') +
      '<td class="broj"><strong>' + tekstBodova(r.ukupno) + '</strong></td>' +
      '<td class="broj">' + r.govora + '</td>' +
      '<td class="broj">' + (r.govora > 0 ? tekstBodova(r.prosjek) : '—') + '</td>' +
      '</tr>';
  });
  return html + '</tbody></table></div>';
}
