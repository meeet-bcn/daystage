import { Concert } from '@/data/concerts';

export type SortKey = 'date' | 'popular' | 'price' | 'name';
export type WhenKey = 'all' | 'today' | 'weekend' | 'week' | 'month';

export type Filters = {
  sort: SortKey;
  when: WhenKey;
  genres: string[];
  maxPrice: number | null;
};

export const DEFAULT_FILTERS: Filters = {
  sort: 'date',
  when: 'all',
  genres: [],
  maxPrice: null,
};

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Fecha' },
  { key: 'popular', label: 'Popularidad' },
  { key: 'price', label: 'Precio' },
  { key: 'name', label: 'A – Z' },
];

export const WHEN_OPTIONS: { key: WhenKey; label: string }[] = [
  { key: 'all', label: 'Cuando sea' },
  { key: 'today', label: 'Hoy' },
  { key: 'weekend', label: 'Este finde' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
];

export const PRICE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Cualquiera' },
  { value: 20, label: 'Hasta 20 €' },
  { value: 50, label: 'Hasta 50 €' },
  { value: 100, label: 'Hasta 100 €' },
];

/** Filtros activos de la hoja (el "cuándo" se ve ya en los chips de Inicio). */
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

const DAY = 24 * 60 * 60 * 1000;

/** Rango [desde, hasta) en ms para cada opción de "cuándo". */
function whenRange(when: WhenKey, now = new Date()): [number, number] | null {
  const today = startOfDay(now);
  const weekday = now.getDay(); // 0 = domingo
  const daysToSunday = (7 - weekday) % 7;
  const endOfWeek = today + (daysToSunday + 1) * DAY;

  switch (when) {
    case 'all':
      return null;
    case 'today':
      return [today, today + DAY];
    case 'weekend': {
      // De viernes a domingo; si ya estamos en finde, desde hoy
      const inWeekend = weekday === 5 || weekday === 6 || weekday === 0;
      const from = inWeekend ? today : today + (5 - weekday) * DAY;
      return [from, endOfWeek];
    }
    case 'week':
      return [today, endOfWeek];
    case 'month':
      return [today, new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()];
  }
}

// Los valores desconocidos (null) van siempre al final
function compareNullable(a: number | null, b: number | null) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return a - b;
}

export function applyFilters(
  concerts: Concert[],
  f: Filters,
  goingCount: (c: Concert) => number
) {
  const range = whenRange(f.when);

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
