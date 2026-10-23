import { Concert } from '@/data/concerts';
import { compactText, foldText } from '@/data/text';

export type SortKey = 'date' | 'popular' | 'price' | 'name';

/**
 * Intervalo de días, ambos incluidos: `from` y `to` son la medianoche (hora
 * local) del primer y del último día. Un solo día: `from === to`.
 */
export type DateRange = { from: number; to: number };

export type Filters = {
  sort: SortKey;
  /** Calendario de Inicio, o null para cualquier fecha. */
  dates: DateRange | null;
  genres: string[];
  maxPrice: number | null;
  /**
   * Idiomas de la gente que quieres conocer (códigos de LANGUAGES). Aún no
   * filtra conciertos: no hay asistentes reales. Cuando los haya, aquí se
   * cruzará con el idioma de cada uno.
   */
  languages: string[];
};

export const DEFAULT_FILTERS: Filters = {
  sort: 'date',
  dates: null,
  genres: [],
  maxPrice: null,
  languages: [],
};

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Fecha' },
  { key: 'popular', label: 'Popularidad' },
  { key: 'price', label: 'Precio' },
  { key: 'name', label: 'A – Z' },
];

/** Idiomas para conocer gente, cada uno escrito en su idioma (la app la usan turistas). */
export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'ca', label: 'Català' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
];

export const PRICE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Cualquiera' },
  { value: 20, label: 'Hasta 20 €' },
  { value: 50, label: 'Hasta 50 €' },
  { value: 100, label: 'Hasta 100 €' },
];

/**
 * ¿Coincide el concierto con la búsqueda? Cada palabra debe aparecer en el
 * artista, la sala, el género o el telonero, sin importar acentos ni signos
 * ("fontaines dc" encuentra "Fontaines D.C.").
 */
export function matchesQuery(c: Concert, query: string) {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const haystack = foldText([c.artist, c.venue, c.genre, c.support].join(' '));
  const compactHaystack = compactText(haystack);
  return words.every((w) => haystack.includes(w) || compactHaystack.includes(compactText(w)));
}

/** Filtros activos de la hoja (las fechas y los idiomas tienen su propio chip en Inicio). */
export function activeFilterCount(f: Filters) {
  return (f.sort !== 'date' ? 1 : 0) + f.genres.length + (f.maxPrice != null ? 1 : 0);
}

export function genresOf(concerts: Concert[]) {
  return [...new Set(concerts.map((c) => c.genre).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Medianoche (hora local) del día de `time`. */
export function dayStart(time: number) {
  return startOfDay(new Date(time));
}

/** Medianoche `days` días después (con Date, para no fallar en los cambios de hora). */
export function addDays(day: number, days: number) {
  const d = new Date(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

/**
 * Siguiente intervalo al tocar `day` en el calendario: el primer toque marca
 * un día; el segundo, si es posterior, cierra el intervalo; si es anterior o
 * el intervalo ya estaba cerrado, se empieza de nuevo desde ese día.
 */
export function pickDay(range: DateRange | null, day: number): DateRange {
  if (range && range.from === range.to && day > range.from) return { from: range.from, to: day };
  return { from: day, to: day };
}

const shortDate = (time: number, withMonth: boolean) =>
  new Date(time).toLocaleDateString(
    'es-ES',
    withMonth ? { day: 'numeric', month: 'short' } : { day: 'numeric' }
  );

/** "24 oct", "24 – 27 oct" o "30 oct – 2 nov". */
export function dateRangeLabel({ from, to }: DateRange) {
  if (from === to) return shortDate(from, true);
  const sameMonth = new Date(from).getMonth() === new Date(to).getMonth();
  return `${shortDate(from, !sameMonth)} – ${shortDate(to, true)}`;
}

// Los valores desconocidos (null) van siempre al final
function compareNullable(a: number | null, b: number | null) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return a - b;
}

export function applyFilters(concerts: Concert[], f: Filters, goingCount: (c: Concert) => number) {
  const range = f.dates ? [f.dates.from, addDays(f.dates.to, 1)] : null;

  const result = concerts.filter((c) => {
    if (range && (c.startsAt == null || c.startsAt < range[0] || c.startsAt >= range[1])) {
      return false;
    }
    if (f.genres.length > 0 && !f.genres.includes(c.genre)) return false;
    if (f.maxPrice != null && (c.priceMin == null || c.priceMin > f.maxPrice)) return false;
    return true;
  });

  const byDate = (a: Concert, b: Concert) => compareNullable(a.startsAt, b.startsAt);

  return result.sort((a, b) => {
    switch (f.sort) {
      case 'date':
        return byDate(a, b);
      case 'popular':
        return goingCount(b) - goingCount(a) || byDate(a, b);
      case 'price':
        return compareNullable(a.priceMin, b.priceMin) || byDate(a, b);
      case 'name':
        return a.artist.localeCompare(b.artist, 'es');
    }
  });
}
