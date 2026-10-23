/** Minúsculas y sin acentos: "Ánimo Sala Apolo" → "animo sala apolo". */
export function foldText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * El artista principal de un nombre de evento, sin gira ni invitados:
 * "Fontaines D.C. - D.C. EU TOUR 2026" → "Fontaines D.C.";
 * "Niall Horan: Dinner Party" → "Niall Horan"; "Romanthica + Lex Lüger" → "Romanthica";
 * "Digitalism (Live)" → "Digitalism".
 */
export function headlinerName(name: string) {
  return name
    .split(/\s[-–—|·+]\s|:\s|\s(?:feat|ft)\.?\s/i)[0]
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

/** Solo letras y números, todo junto: "Fontaines D.C." → "fontainesdc". */
export function compactText(text: string) {
  return foldText(text).replace(/[^a-z0-9]+/g, '');
}
