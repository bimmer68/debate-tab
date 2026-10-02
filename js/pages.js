// Sadržaj svake stranice aplikacije.
// Svaka stranica je funkcija koja vraća HTML kao tekst.
// U kasnijim fazama ove funkcije će prikazivati prave podatke.

var Stranice = {
  pocetna: function () {
    return (
      '<h1>Dobro došli u Debate Tab</h1>' +
      '<p>Aplikacija za vođenje debatnih turnira: timovi, sudije, parovanje, sudijski listići i poredak.</p>' +
      '<div class="mreza">' +
        plocica('postavke', 'Postavke', 'Naziv turnira, format i broj rundi.') +
        plocica('timovi', 'Timovi', 'Klubovi, timovi i govornici.') +
        plocica('sudije', 'Sudije', 'Sudije i klubovi kojima pripadaju.') +
        plocica('runde', 'Runde', 'Parovanje i unos sudijskih listića.') +
        plocica('tab', 'Tab', 'Poredak timova i govornika.') +
      '</div>'
    );
  },

  postavke: stranicaPostavki,

  timovi: stranicaTimova,

  sudije: stranicaSudija,

  runde: stranicaRundi,

  tab: stranicaTaba,

  nijePronadjena: function () {
    return (
      '<h1>Stranica ne postoji</h1>' +
      '<p><a href="#/">Nazad na početnu</a></p>'
    );
  }
};

// Neke stranice, nakon što se prikažu, trebaju povezati dugmad i polja
// sa funkcijama. Ovdje piše koja funkcija se tada pokreće.
var NakonPrikaza = {
  postavke: pokreniPostavke,
  timovi: pokreniTimove,
  sudije: pokreniSudije,
  runde: pokreniRunde
};

// Jedna pločica (kartica) na početnoj stranici.
function plocica(kljuc, naslov, opis) {
  return (
    '<a class="kartica" href="#/' + kljuc + '">' +
      '<h2>' + naslov + '</h2>' +
      '<p class="napomena">' + opis + '</p>' +
    '</a>'
  );
}
