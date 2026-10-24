// Conciertos de la Agenda Cultural del Ayuntamiento de Barcelona (Open Data
// BCN, licencia CC BY 4.0: hay que citar «Ajuntament de Barcelona»).
//
// El archivo original pesa ~170 MB (toda la agenda cultural, con histórico),
// demasiado para el móvil. `scripts/build-bcn-agenda.mjs` lo descarga a diario,
// se queda con los conciertos futuros con `buildFeed` y publica un archivo
// pequeño (BcnFeed) que la app lee como una fuente más (sources/bcn.ts).
//
// Este módulo lo usan la app y el script de Node: sin alias `@/` y sin
// dependencias, solo tipos y funciones puras.

/** Lo que usamos de cada actividad del archivo original. */
export type BcnRawEvent = {
  register_id: number;
  name: string;
  body?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  classifications_data?: { name: string; full_path?: string }[] | null;
  addresses?:
    | {
        place?: string | null;
        address_name?: string | null;
        start_street_number?: number | null;
        zip_code?: string | null;
        town?: string | null;
        location_4326?: {
          type?: string;
          geometries?: { type?: string; coordinates?: number[] }[];
        } | null;
      }[]
    | null;
  image_data?: { image?: string | null } | null;
  timetable?: { html?: string | null } | null;
  tickets_data?: { name: string }[] | null;
  values?: { attribute_name?: string | null; url_value?: string | null }[] | null;
};

/** Un concierto del archivo publicado: ya limpio y compacto. */
export type BcnConcert = {
  id: string;
  /** Lo que se muestra como artista: el nombre sin "Concert" ni comillas. */
  artist: string;
  /** Día (YYYY-MM-DD, hora local) y hora (HH:MM:SS) si el horario la trae. */
  date: string;
  time: string;
  venue: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image: string;
  /** Web de venta de entradas (o de información), o ''. */
  url: string;
  free: boolean;
  priceMin: number | null;
  genre: string;
  info: string;
};

export type BcnFeed = {
  version: 1;
  generatedAt: string;
  attribution: string;
  concerts: BcnConcert[];
};

export const BCN_ATTRIBUTION = 'Ajuntament de Barcelona · Open Data BCN (CC BY 4.0)';
const INFO_MAX = 700;

// Géneros de la agenda (catalán) → como los mostramos
const GENRES: Record<string, string> = {
  'Música clàssica': 'Clásica',
  'Jazz, Blues': 'Jazz',
  Pop: 'Pop',
  Rock: 'Rock',
  'Música electrònica,  techno, dance': 'Electrónica',
  Flamenc: 'Flamenco',
  Òpera: 'Ópera',
  'Música folklòrica i ètnica': 'Folk',
  'Cant coral': 'Coral',
  'Hip-hop, rap': 'Hip hop',
  'Soul, funk, r&b': 'Soul',
  'Música llatina': 'Latino',
  Cantautors: 'Cantautor',
};

// Tipologías que, junto a "Concerts", delatan que no es un concierto sino una
// fiesta, feria o taller con algo de música (la "Fira del Vi", una presentación…)
const NOT_A_CONCERT = [
  'Degustacions',
  'Cursos i tallers',
  'Mostres, fires i salons',
  'Presentacions',
  'Jocs',
  'Festes',
  'Correfoc',
  'Diades',
];

/** ¿Es un concierto? Tipología "Concerts" y ninguna de fiesta, feria o taller. */
export function isConcert(event: BcnRawEvent) {
  const types = (event.classifications_data ?? [])
    .map((c) => c.full_path ?? '')
    .filter((path) => path.startsWith('Tipologia'));
  return (
    types.some((path) => path.endsWith('>> Concerts')) &&
    !types.some((path) => NOT_A_CONCERT.some((noise) => path.includes(`>> ${noise}`)))
  );
}

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&rsquo;': '’',
};

/** HTML de la agenda → texto plano en una línea por párrafo. */
export function htmlToText(html: string) {
  return html
    .replace(/<\/(p|li|div|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Hora y precio del horario (una tabla HTML): «a les 19.30 h» o «de 21.00 h a
 * 00.00 h» → 19:30:00; «Entrada general: 28 €» → 28; «Entrada Gratuïta» → gratis.
 */
export function parseTimetable(html: string) {
  const text = htmlToText(html);
  const hour = text.match(/\b(\d{1,2})[.:](\d{2})\s*h\b/);
  const time = hour ? `${hour[1].padStart(2, '0')}:${hour[2]}:00` : '';
  const prices = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*€/g)].map((m) =>
    parseFloat(m[1].replace(',', '.'))
  );
  const free = /gratu[iï]t/i.test(text);
  return {
    time,
    priceMin: prices.length > 0 ? Math.min(...prices) : free ? 0 : null,
    free,
  };
}

/**
 * «Concert "Kurt Rosenwinkel"» → «Kurt Rosenwinkel»; «Concert "Canta Sinatra",
 * amb Bresca» → «Canta Sinatra, amb Bresca». Lo que no empieza así, tal cual.
 */
export function cleanConcertName(name: string) {
  const clean = name.replace(/\s+/g, ' ').trim();
  const quoted = clean.match(/^(?:concerts?|recital)(?: de)?\s*[:\-]?\s*["“'‘](.+?)["”'’](.*)$/i);
  return quoted ? `${quoted[1]}${quoted[2]}`.trim() : clean;
}

const WEB_ATTRIBUTES = ["Web venda d'entrades", 'Web inscripcions', 'Web'];

export function toBcnConcert(event: BcnRawEvent): BcnConcert | null {
  if (!event.start_date) return null;
  const place = event.addresses?.[0];
  const [lat, lng] = place?.location_4326?.geometries?.[0]?.coordinates ?? [];
  const { time, priceMin, free } = parseTimetable(event.timetable?.html ?? '');
  const url =
    WEB_ATTRIBUTES.map(
      (name) => event.values?.find((v) => v.attribute_name === name && v.url_value)?.url_value
    ).find(Boolean) ?? '';
  const genre = (event.classifications_data ?? []).map((c) => GENRES[c.name]).find(Boolean) ?? '';
  const street = [place?.address_name, place?.start_street_number].filter(Boolean).join(', ');
  const info = htmlToText(event.body ?? '');

  return {
    id: `bcn-${event.register_id}`,
    artist: cleanConcertName(event.name),
    // La fecha trae una hora de relleno (03:00, 12:00): la de verdad está en el horario
    date: event.start_date.slice(0, 10),
    time,
    venue: place?.place?.replace(/\s*\*\s*/g, ' · ').trim() || 'Lugar por confirmar',
    address: [street, [place?.zip_code, 'Barcelona'].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', '),
    latitude: typeof lat === 'number' ? lat : null,
    longitude: typeof lng === 'number' ? lng : null,
    image: event.image_data?.image ?? '',
    url,
    free: free || (event.tickets_data ?? []).some((t) => t.name === 'Lliure'),
    priceMin,
    genre,
    info: info.length > INFO_MAX ? `${info.slice(0, INFO_MAX - 1).trimEnd()}…` : info,
  };
}

/**
 * Conciertos de un solo día desde `today` (YYYY-MM-DD), por fecha. Los ciclos y
 * festivales de varios días se dejan fuera: no tienen una fecha a la que ir.
 */
export function buildFeed(events: BcnRawEvent[], today: string, generatedAt: string): BcnFeed {
  const concerts = events
    .filter(isConcert)
    .filter(
      (e) => e.start_date && e.start_date.slice(0, 10) === (e.end_date ?? e.start_date).slice(0, 10)
    )
    .filter((e) => (e.start_date as string).slice(0, 10) >= today)
    .map(toBcnConcert)
    .filter((c): c is BcnConcert => c !== null)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return { version: 1, generatedAt, attribution: BCN_ATTRIBUTION, concerts };
}
