// Limpieza de los textos de Ticketmaster: `info` y `pleaseNote` mezclan la
// reseña del concierto con letra pequeña de venta (gastos de gestión, entradas
// móviles, formularios de menores...). Aquí separamos lo que interesa mostrar.

export type EventInfo = {
  /** Texto editorial sobre el concierto, o '' si no hay. */
  about: string;
  /** Hora de apertura de puertas, p. ej. "19:30". */
  doors: string;
  /** Telonero o artista invitado. */
  support: string;
  /** Política de edad resumida. */
  ages: string;
};

// Encabezados y frases con los que empieza la logística, en español e inglés.
// Todo lo que va a partir del primero que aparezca deja de ser la reseña.
const LOGISTICS_MARKERS = [
  /\bHorarios\b/,
  /\bEdades\b/,
  /\bApertura de puertas\b/i,
  /\bEntradas (digitales|m[oó]viles)\b/i,
  /\bMovilidad reducida\b/i,
  /\bGeneraci[oó]n en diferido\b/i,
  /\bLos menores de \d+/i,
  /\bMenores de \d+/i,
  /\bA handling fee\b/i,
  /\bSupport:/,
  /\bArtista invitad[oa]s?:/i,
  /\bTeloneros?:/i,
  /\b(Minors|Children) under\b/i,
  /\b(Digital|Mobile) tickets\b/i,
  /\bDelayed delivery\b/i,
  /\bAll attendees must\b/i,
];

function clean(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function firstMarkerIndex(text: string) {
  let cut = text.length;
  for (const marker of LOGISTICS_MARKERS) {
    const match = marker.exec(text);
    if (match && match.index < cut) cut = match.index;
  }
  return cut;
}

function editorialPart(text: string) {
  const about = clean(text.slice(0, firstMarkerIndex(text)));
  // Restos demasiado cortos (p. ej. solo el nombre de la gira) no aportan nada
  return about.length >= 40 ? about : '';
}

function findDoors(text: string) {
  const match = /(?:Apertura de puertas|Doors(?: open)?)[:\s]*(\d{1,2})[:.](\d{2})/i.exec(text);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

function findSupport(text: string) {
  const label = /\b(?:Support|Teloneros?|Artistas? invitad[oa]s?):\s*/i.exec(text);
  if (!label) return '';

  // "Support: CHALK Minors under..." → el nombre llega hasta la siguiente logística o el fin de frase
  const rest = text.slice(label.index + label[0].length);
  const name = rest.slice(0, firstMarkerIndex(rest)).split(/[.\n]/)[0].trim();

  // Descarta horas ("Artista Invitado: 19:30h") y capturas desbocadas
  return /^\d/.test(name) || name.length > 60 ? '' : name;
}

function findAges(text: string) {
  const onlyAdults =
    /(?:s[oó]lo\s+(?:para\s+)?mayores de|prohibid[ao]s?\s+(?:a|para)\s+(?:los\s+)?menores de|only\s+over|over\s+(?=\d+\s+only))\s*(\d{1,2})/i.exec(
      text
    );
  if (onlyAdults) return `Solo mayores de ${onlyAdults[1]}`;

  const minors = /(?:menores de|under(?: the age of)?)\s*(\d{1,2})/i.exec(text);
  if (minors) return `Menores de ${minors[1]}, con un adulto`;

  return '';
}

export function parseEventInfo(description?: string, info?: string, pleaseNote?: string): EventInfo {
  const all = [info, pleaseNote].filter(Boolean).join(' ');
  const about = description?.trim() ? clean(description) : editorialPart(info ?? '');

  return {
    about,
    doors: findDoors(all),
    support: findSupport(all),
    ages: findAges(all),
  };
}

/** Nombres con saltos de línea o espacios de más ("Fontaines D.C. - ... 2026\n"). */
export function cleanName(name: string) {
  return name.replace(/\s+/g, ' ').trim();
}

/** Eventos de prueba que Ticketmaster deja publicados ("Test 11068686 case"). */
export function isTestEvent(name: string) {
  return /^test\b/i.test(name.trim());
}
