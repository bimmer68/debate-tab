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
