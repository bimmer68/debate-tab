// Male pomoćne funkcije koje koristi više fajlova.

// Tekst koji je upisao korisnik pretvara u siguran HTML.
// Bez ovoga bi npr. naziv turnira "<b>Kup</b>" postao podebljan tekst,
// ili, još gore, mogao bi pokrenuti tuđi kod.
function sigurnoHtml(tekst) {
  return String(tekst)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- Forme ----
// Koriste ih sve stranice sa formama (Postavke, Timovi, Sudije).

// Prazno mjesto ispod polja u koje se upiše greška za to polje.
function mjestoZaGresku(ime) {
  return '<span id="greska-' + ime + '" class="greska-polja" aria-live="polite"></span>';
}

// Upiše svaku grešku pored njenog polja i to polje oboji crveno.
// Vraća true ako ima barem jedna greška.
function prikaziGreske(forma, greske) {
  var prvoNeispravno = null;
  var polja = forma.querySelectorAll('input[aria-describedby], select[aria-describedby]');
  for (var i = 0; i < polja.length; i++) {
    var polje = polja[i];
    var tekst = greske[polje.name] || '';
    document.getElementById('greska-' + polje.name).textContent = tekst;
    if (tekst) {
      polje.setAttribute('aria-invalid', 'true');
      prvoNeispravno = prvoNeispravno || polje;
    } else {
      polje.removeAttribute('aria-invalid');
    }
  }
  if (prvoNeispravno) {
    prvoNeispravno.focus(); // korisnik odmah vidi gdje je problem
  }
  return prvoNeispravno !== null;
}

// Poruka pored dugmeta, npr. "Postavke su sačuvane." (zeleno) ili greška (crveno).
function prikaziPoruku(id, tekst, jeGreska) {
  var element = document.getElementById(id);
  element.textContent = tekst;
  element.classList.toggle('greska', jeGreska);
  element.classList.toggle('uspjeh', !jeGreska);
}
