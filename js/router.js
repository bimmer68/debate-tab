// Navigacija između stranica.
// Adresa izgleda ovako: index.html#/timovi
// Dio iza "#/" govori koja se stranica prikazuje.
// Ovakva navigacija radi i kad se index.html otvori direktno iz fajla,
// i na GitHub Pages, bez servera.

function trenutnaStranica() {
  // "#/timovi" -> "timovi"; prazna adresa -> "pocetna"
  var kljuc = window.location.hash.replace('#/', '').replace('#', '');
  return kljuc === '' ? 'pocetna' : kljuc;
}

function prikaziStranicu() {
  var kljuc = trenutnaStranica();
  var stranica = Stranice[kljuc] || Stranice.nijePronadjena;

  document.getElementById('sadrzaj').innerHTML = stranica();
  if (NakonPrikaza[kljuc]) {
    NakonPrikaza[kljuc]();
  }
  oznaciAktivniLink(kljuc);
  window.scrollTo(0, 0);
}

// Označi u navigaciji stranicu na kojoj se korisnik nalazi.
function oznaciAktivniLink(kljuc) {
  var linkovi = document.querySelectorAll('.navigacija a');
  for (var i = 0; i < linkovi.length; i++) {
    var jeAktivan = linkovi[i].dataset.stranica === kljuc;
    linkovi[i].classList.toggle('aktivna', jeAktivan);
    if (jeAktivan) {
      linkovi[i].setAttribute('aria-current', 'page');
    } else {
      linkovi[i].removeAttribute('aria-current');
    }
  }
}
