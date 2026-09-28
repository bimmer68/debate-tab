// Tamna i svijetla tema.
// Zadana je tamna tema. Izbor korisnika pamtimo u localStorage,
// da ostane isti i kad se aplikacija ponovo otvori.
// Ovaj fajl se učitava u <head>, prije ostatka stranice,
// da stranica ne "bljesne" pogrešnom bojom dok se učitava.

var KLJUC_TEME = 'debateTab.tema';

function ucitajTemu() {
  try {
    return localStorage.getItem(KLJUC_TEME) === 'svijetla' ? 'svijetla' : 'tamna';
  } catch (e) {
    return 'tamna';
  }
}

function postaviTemu(tema) {
  document.documentElement.setAttribute('data-tema', tema);
  try {
    localStorage.setItem(KLJUC_TEME, tema);
  } catch (e) {
    // Ako browser ne dozvoljava spremanje, tema i dalje radi dok je stranica otvorena.
  }
  osvjeziPrekidacTeme();
}

// Tekst na dugmetu pokazuje u koju temu se prelazi klikom.
function osvjeziPrekidacTeme() {
  var dugme = document.getElementById('prekidac-teme');
  if (!dugme) {
    return;
  }
  var tamna = document.documentElement.getAttribute('data-tema') !== 'svijetla';
  dugme.textContent = tamna ? '☀ Svijetla tema' : '☾ Tamna tema';
  dugme.setAttribute('aria-pressed', tamna ? 'false' : 'true');
}

function promijeniTemu() {
  var trenutna = document.documentElement.getAttribute('data-tema');
  postaviTemu(trenutna === 'svijetla' ? 'tamna' : 'svijetla');
}

// Odmah primijeni spremljenu temu (još prije nego se prikaže sadržaj).
document.documentElement.setAttribute('data-tema', ucitajTemu());
