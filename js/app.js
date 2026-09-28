// Pokretanje aplikacije.

// Kad se promijeni dio adrese iza "#", prikaži novu stranicu.
window.addEventListener('hashchange', prikaziStranicu);

// Prikaži prvu stranicu čim se aplikacija otvori.
prikaziStranicu();

// Dugme za promjenu teme u navigaciji.
document.getElementById('prekidac-teme').addEventListener('click', promijeniTemu);
osvjeziPrekidacTeme();
