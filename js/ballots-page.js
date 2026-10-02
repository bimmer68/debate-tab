// Forma za unos sudijskih listića jedne sobe (dio stranice "Runde").
// Pravila i računanje su u ballots.js. Ovdje je samo izgled i čitanje forme.
//
// Forma ima dva dijela:
//   1. Govornici: ko govori na kojem mjestu (i ko drži repliku u WSDC-u). Zajedničko za sobu.
//   2. Po jedan sudijski listić za svakog sudiju u sobi: bodovi svih govora, redom kako se drže.
// Dok se kuca, ispod svakog sudijskog listića se odmah vidi zbir timova i ko pobjeđuje.

// Indeks sobe čiji se sudijski listići trenutno unose, ili null kad forma nije otvorena.
var sobaZaListic = null;

function htmlFormeListica(turnir, runda, indeks) {
  var soba = runda.sobe[indeks];
  var podaci = pocetniPodaci(turnir, soba);
  var uneseno = Boolean(soba.rezultat);

  var html =
    '<section class="kartica">' +
      '<h2>Runda ' + runda.broj + ' · Soba ' + (indeks + 1) + ' ' + oznakaStatusaListica(uneseno) + '</h2>' +
      htmlTimovaSobe(turnir, soba) +
      '<p class="napomena">Pobjednik se ne bira posebno: aplikacija ga izračuna iz bodova. ' +
        'Bodovi su cijeli brojevi: ' + opisRaspona(turnir) + '. Neriješeno nije dozvoljeno.' +
        (soba.sudije.length > 1 ? ' Svaki sudija ima svoj sudijski listić; tim pobjeđuje u sobi ako dobije većinu sudijskih listića, ' +
          'a bod govornika je prosjek svih sudija.' : '') + '</p>' +
      '<form id="forma-listica" novalidate>' +
        htmlGovornika(turnir, soba, podaci);

  soba.sudije.forEach(function (sudijaId, b) {
    html += htmlListica(turnir, soba, podaci.listici[b], b);
  });

  html +=
        '<div id="rezultat-forme" class="rezultat-sobe" aria-live="polite"></div>' +
        '<div class="akcije">' +
          '<button type="submit" class="dugme">Sačuvaj sudijske listiće</button>' +
          '<button type="button" class="dugme dugme-sporedno" data-akcija="zatvori-listic">Odustani</button>' +
          '<span id="poruka-runde" class="poruka" role="status"></span>' +
        '</div>' +
      '</form>' +
    '</section>';
  return html;
}

// "nije uneseno" / "uneseno" pored naslova sobe.
function oznakaStatusaListica(uneseno) {
  return uneseno ?
    '<span class="status status-uneseno">Uneseno</span>' :
    '<span class="status status-nije-uneseno">Nije uneseno</span>';
}

// npr. "glavni govor od 60 do 80, replika od 30 do 40"
function opisRaspona(turnir) {
  var definicije = Formati[turnir.postavke.format].rasponi;
  var dijelovi = [];
  for (var kljuc in definicije) {
    var r = turnir.postavke.rasponi[kljuc];
    dijelovi.push(definicije[kljuc].naziv.toLowerCase() + ' od ' + r.min + ' do ' + r.max);
  }
  return dijelovi.join(', ');
}

// Timovi u sobi po pozicijama. Swing tim dobije napomenu.
function htmlTimovaSobe(turnir, soba) {
  var nazivi = pozicije(turnir);
  var html = '<dl class="pozicije">';
  soba.timovi.forEach(function (id, t) {
    var tim = nadjiPoId(turnir.timovi, id);
    html += '<dt>' + nazivi[t] + '</dt><dd>' + sigurnoHtml(tim ? tim.naziv : 'Obrisan tim') +
      (tim && tim.swing ? ' <span class="napomena">(swing tim: boduje se normalno, ali ne ulazi u poredak)</span>' : '') +
      '</dd>';
  });
  return html + '</dl>';
}

// Ono što forma pokaže kad se otvori: spremljeni sudijski listići ako postoje,
// inače govornici redom kako su upisani u timu i prazni bodovi.
// Oblik je isti kao podaci u provjeriListice (bodovi su tekst).
function pocetniPodaci(turnir, soba) {
  var r = soba.rezultat;
  var broj = brojGovornika(turnir);
  var govornici = soba.timovi.map(function (id, t) {
    if (r) {
      return r.govornici[t].slice();
    }
    var tim = nadjiPoId(turnir.timovi, id);
    return tim ? tim.govornici.slice(0, broj).map(function (g) { return g.id; }) : [];
  });
  var replika = soba.timovi.map(function (id, t) {
    return r && r.replika[t] ? r.replika[t] : '';
  });
  var listici = soba.sudije.map(function (sudijaId) {
    var spremljeni = r ? r.listici.filter(function (b) { return b.sudijaId === sudijaId; })[0] : null;
    return {
      sudijaId: sudijaId,
      govori: soba.timovi.map(function (id, t) {
        var bodovi = [];
        for (var i = 0; i < broj; i++) {
          bodovi.push(spremljeni ? String(spremljeni.govori[t][i]) : '');
        }
        return bodovi;
      }),
      replike: soba.timovi.map(function (id, t) {
        return spremljeni && imaRepliku(turnir) ? String(spremljeni.replike[t]) : '';
      })
    };
  });
  return { govornici: govornici, replika: replika, listici: listici };
}

// Dio 1: ko govori na kojem mjestu, po timovima.
function htmlGovornika(turnir, soba, podaci) {
  var broj = brojGovornika(turnir);
  var format = Formati[turnir.postavke.format];
  var html = '<fieldset class="okvir-listica"><legend>Govornici</legend>' +
    '<p class="napomena">Izaberi ko je govorio na kojem mjestu' +
      (imaRepliku(turnir) ? ' i ko drži repliku' : '') + '. Isto važi za sve sudije u sobi.</p>' +
    '<div class="mreza-govornika">';

  soba.timovi.forEach(function (id, t) {
    var tim = nadjiPoId(turnir.timovi, id);
    var clanovi = tim ? tim.govornici : [];
    html += '<div class="tim-govornici"><h3>' + format.pozicije[t] + ': ' + sigurnoHtml(tim ? tim.naziv : '?') + '</h3>';
    for (var i = 0; i < broj; i++) {
      html += poljeIzboraGovornika(poljeGovornika(t, i), format.oznake[t] + (i + 1), clanovi, podaci.govornici[t][i], false);
    }
    if (imaRepliku(turnir)) {
      if (broj === 1) {
        html += '<p class="napomena">Repliku drži jedini govornik.</p>';
      } else {
        html += poljeIzboraGovornika(poljeReplike(t), 'Replika (ne zadnji govornik)', clanovi, podaci.replika[t], true);
      }
    }
    html += '</div>';
  });
  return html + '</div></fieldset>';
}

function poljeIzboraGovornika(ime, oznaka, clanovi, odabrani, saPraznom) {
  var opcije = saPraznom ? '<option value="">— izaberi —</option>' : '';
  clanovi.forEach(function (g) {
    opcije += '<option value="' + sigurnoHtml(g.id) + '"' + (g.id === odabrani ? ' selected' : '') + '>' +
      sigurnoHtml(g.ime) + '</option>';
  });
  return '<label class="polje polje-govornika"><span class="oznaka-govora">' + sigurnoHtml(oznaka) + '</span>' +
    '<select name="' + ime + '" aria-describedby="greska-' + ime + '">' + opcije + '</select>' +
    mjestoZaGresku(ime) + '</label>';
}

// Dio 2: jedan sudijski listić (jedan sudija). Govori su poredani kako se drže u debati.
function htmlListica(turnir, soba, listic, b) {
  var sudija = nadjiPoId(turnir.sudije, listic.sudijaId);
  var unakrsno = Formati[turnir.postavke.format].unakrsnoNakon || [];
  var html = '<fieldset class="okvir-listica"><legend>' +
    (soba.sudije.length > 1 ? 'Sudijski listić ' + (b + 1) + ': ' : 'Sudijski listić: ') + sigurnoHtml(sudija ? sudija.ime : 'Obrisan sudija') +
    '</legend><div class="redovi-bodova">';

  redoslijedGovora(turnir).forEach(function (govor) {
    var ime = poljeBoda(b, govor.tim, govor.mjesto);
    var raspon = rasponZaGovor(turnir, govor.vrsta);
    var vrijednost = govor.vrsta === 'replika' ? listic.replike[govor.tim] : listic.govori[govor.tim][govor.mjesto];
    html += '<label class="red-boda' + (govor.vrsta === 'replika' ? ' red-replike' : '') + '">' +
      '<span class="oznaka-govora">' + govor.oznaka + '</span>' +
      '<span class="ime-govornika" data-tim="' + govor.tim + '" data-mjesto="' + govor.mjesto + '"></span>' +
      '<input type="text" inputmode="numeric" autocomplete="off" name="' + ime + '" value="' + sigurnoHtml(vrijednost) + '"' +
        ' placeholder="' + raspon.min + '–' + raspon.max + '" aria-describedby="greska-' + ime + '">' +
      mjestoZaGresku(ime) +
    '</label>';
    if (unakrsno.indexOf(govor.oznaka) !== -1) {
      html += '<p class="unakrsno">Unakrsno ispitivanje (ne boduje se)</p>';
    }
  });

  return html + '</div>' +
    '<p id="zbir-' + b + '" class="zbir-listica"></p>' +
    '<p id="greska-listica-' + b + '" class="greska-polja" aria-live="polite"></p>' +
    '</fieldset>';
}

// ---- Čitanje forme ----

// Sve što je upisano na formi, u obliku koji traži provjeriListice (bodovi ostaju tekst).
function procitajFormuListica(forma, turnir, soba) {
  var broj = brojGovornika(turnir);
  var polja = forma.elements;
  var govornici = soba.timovi.map(function (id, t) {
    var red = [];
    for (var i = 0; i < broj; i++) {
      red.push(polja[poljeGovornika(t, i)].value);
    }
    return red;
  });
  var replika = !imaRepliku(turnir) ? [] : soba.timovi.map(function (id, t) {
    // U 1v1 repliku drži jedini govornik, pa nema šta birati.
    return broj === 1 ? govornici[t][0] : polja[poljeReplike(t)].value;
  });
  var listici = soba.sudije.map(function (sudijaId, b) {
    return {
      sudijaId: sudijaId,
      govori: soba.timovi.map(function (id, t) {
        var bodovi = [];
        for (var i = 0; i < broj; i++) {
          bodovi.push(polja[poljeBoda(b, t, i)].value);
        }
        return bodovi;
      }),
      replike: !imaRepliku(turnir) ? [] : soba.timovi.map(function (id, t) {
        return polja[poljeBoda(b, t, -1)].value;
      })
    };
  });
  return { govornici: govornici, replika: replika, listici: listici };
}

// ---- Živi prikaz (dok se kuca) ----

// Poziva se kod svake promjene na formi: upiše imena govornika pored bodova,
// zbir timova ispod svakog sudijskog listića i rezultat sobe na dnu.
function osvjeziZiviPrikaz(forma) {
  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  var soba = runda.sobe[sobaZaListic];
  var podaci = procitajFormuListica(forma, turnir, soba);

  var imena = forma.querySelectorAll('.ime-govornika');
  for (var i = 0; i < imena.length; i++) {
    var t = Number(imena[i].dataset.tim);
    var mjesto = Number(imena[i].dataset.mjesto);
    var id = mjesto === -1 ? podaci.replika[t] : podaci.govornici[t][mjesto];
    var govornik = nadjiPoId(sviGovornici(turnir), id);
    imena[i].textContent = govornik ? govornik.ime : '—';
  }

  var sviGotovi = true;
  podaci.listici.forEach(function (listic, b) {
    var element = document.getElementById('zbir-' + b);
    var zbirovi = zbiroviAkoSuBodoviIspravni(turnir, listic);
    if (!zbirovi) {
      element.textContent = 'Zbir: upiši sve bodove (' + opisRaspona(turnir) + ').';
      element.className = 'zbir-listica';
      sviGotovi = false;
      return;
    }
    var greska = greskaZbira(turnir, zbirovi);
    element.textContent = 'Zbir: ' + tekstZbirova(turnir, zbirovi) + (greska ? '' : ' → ' + tekstPoretkaListica(turnir, soba, zbirovi));
    element.className = 'zbir-listica' + (greska ? ' zbir-nerijeseno' : '');
    if (greska) {
      element.textContent += ' — neriješeno nije dozvoljeno.';
      sviGotovi = false;
    }
  });

  var rezultatForme = document.getElementById('rezultat-forme');
  if (sviGotovi && podaci.listici.length > 0) {
    var rezultat = rezultatSobe(turnir, soba, pretvoriRezultat(podaci));
    rezultatForme.textContent = rezultat.odluceno ?
      'Rezultat sobe: ' + opisRezultata(turnir, soba, rezultat) :
      'Iz sudijskih listića se ne može odrediti pobjednik sobe.';
  } else {
    rezultatForme.textContent = '';
  }
}

// Kad se polje ispravlja, stara greška pored njega više ne važi.
function ukloniGreskuPolja(polje) {
  var greska = polje.name && document.getElementById('greska-' + polje.name);
  if (greska) {
    greska.textContent = '';
    polje.removeAttribute('aria-invalid');
  }
}

// Zbirovi timova na sudijskom listiću, ili null ako neki bod još nije ispravan.
function zbiroviAkoSuBodoviIspravni(turnir, listic) {
  var ispravno = redoslijedGovora(turnir).every(function (govor) {
    return !greskaBoda(tekstBoda(listic, govor), rasponZaGovor(turnir, govor.vrsta));
  });
  return ispravno ? zbiroviListica(turnir, pretvoriListic(listic)) : null;
}

// "P 214 : 213 O" ili kod BP-a "OG 150 · OO 162 · CG 148 · CO 155"
function tekstZbirova(turnir, zbirovi) {
  var oznake = Formati[turnir.postavke.format].oznake;
  if (zbirovi.length === 2) {
    return oznake[0] + ' ' + zbirovi[0] + ' : ' + zbirovi[1] + ' ' + oznake[1];
  }
  return zbirovi.map(function (z, t) { return oznake[t] + ' ' + z; }).join(' · ');
}

// Ko pobjeđuje na jednom sudijskom listiću: "pobjeđuje Mostar A" ili kod BP-a "1. OO, 2. CO, 3. OG, 4. CG".
function tekstPoretkaListica(turnir, soba, zbirovi) {
  var poredak = poredakPoZbiru(zbirovi);
  if (zbirovi.length === 2) {
    return 'pobjeđuje ' + nazivTimaUSobi(turnir, soba, poredak[0]);
  }
  var oznake = Formati[turnir.postavke.format].oznake;
  return poredak.map(function (t, mjesto) { return (mjesto + 1) + '. ' + oznake[t]; }).join(', ');
}

// Rezultat sobe za prikaz, npr. "pobjednik Mostar A (2:1 sudijskih listića)"
// ili kod BP-a "1. Mostar A (OO), 2. Tuzla B (CO), ...".
function opisRezultata(turnir, soba, rezultat) {
  if (soba.timovi.length === 2) {
    var pobjednik = rezultat.poredak[0];
    var gubitnik = rezultat.poredak[1];
    return 'pobjednik ' + nazivTimaUSobi(turnir, soba, pobjednik) +
      (rezultat.zbirovi.length > 1 ? ' (' + rezultat.glasovi[pobjednik] + ':' + rezultat.glasovi[gubitnik] + ' sudijskih listića)' : '');
  }
  var oznake = Formati[turnir.postavke.format].oznake;
  return rezultat.poredak.map(function (t, mjesto) {
    return (mjesto + 1) + '. ' + nazivTimaUSobi(turnir, soba, t) + ' (' + oznake[t] + ')';
  }).join(', ');
}

function nazivTimaUSobi(turnir, soba, t) {
  var tim = nadjiPoId(turnir.timovi, soba.timovi[t]);
  return tim ? tim.naziv : '?';
}

// ---- Akcije ----

function otvoriListic(indeks) {
  sobaZaListic = indeks;
  osvjeziRunde('', false);
  osvjeziZiviPrikaz(document.getElementById('forma-listica'));
  window.scrollTo(0, 0);
}

function zatvoriListic() {
  sobaZaListic = null;
  osvjeziRunde('', false);
}

function spremiListic(forma) {
  var turnir = ucitajTurnir();
  var runda = nadjiRundu(turnir, 1);
  if (!runda || runda.status !== 'objavljena' || !runda.sobe[sobaZaListic]) {
    sobaZaListic = null;
    osvjeziRunde('Sudijski listići se unose samo za objavljene runde.', true);
    return;
  }
  var soba = runda.sobe[sobaZaListic];
  var podaci = procitajFormuListica(forma, turnir, soba);
  var greske = provjeriListice(turnir, soba, podaci);

  var imaGresakaPolja = prikaziGreske(forma, greske.polja);
  greske.listici.forEach(function (greska, b) {
    document.getElementById('greska-listica-' + b).textContent = greska;
  });
  if (!listiciIspravni(greske)) {
    prikaziPoruku('poruka-runde', greske.soba || 'Sudijski listići nisu sačuvani. Ispravi ono što je označeno crveno.', true);
    if (!imaGresakaPolja) {
      // Nema grešaka u poljima, ali ima neriješenih sudijskih listića: pokaži prvi takav.
      var prvi = greske.listici.indexOf(greske.listici.filter(function (g) { return g; })[0]);
      if (prvi !== -1) {
        document.getElementById('greska-listica-' + prvi).scrollIntoView({ block: 'center' });
      }
    }
    return;
  }

  soba.rezultat = pretvoriRezultat(podaci);
  if (!sacuvajTurnir(turnir)) {
    prikaziPoruku('poruka-runde', 'Spremanje nije uspjelo.', true);
    return;
  }
  var brojSobe = sobaZaListic + 1;
  sobaZaListic = null;
  osvjeziRunde('Sudijski listići za sobu ' + brojSobe + ' su sačuvani: ' +
    opisRezultata(turnir, soba, rezultatSobe(turnir, soba, soba.rezultat)) + '.', false);
}
