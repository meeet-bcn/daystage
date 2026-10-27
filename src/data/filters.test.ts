import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import type { Concert } from '@/data/concerts';
import {
  activeFilterCount,
  applyFilters,
  dateRangeLabel,
  DEFAULT_FILTERS,
  Filters,
  genresOf,
  matchesQuery,
  isQuickRange,
  pickDay,
  quickRange,
} from '@/data/filters';

// Miércoles 21 de octubre de 2026, 12:00 (hora local)
const NOW = new Date(2026, 9, 21, 12, 0);
const at = (day: number, month = 9) => new Date(2026, month, day, 21, 0).getTime();

const today = makeConcert({ id: 'hoy', artist: 'Charlie', startsAt: at(21), priceMin: 40 });
const friday = makeConcert({
  id: 'vie',
  artist: 'alfa',
  startsAt: at(23),
  priceMin: 15,
  genre: 'Rock',
});
const sunday = makeConcert({
  id: 'dom',
  artist: 'Bravo',
  startsAt: at(25),
  priceMin: null,
  genre: 'Pop',
});
const nextWeek = makeConcert({
  id: 'sem',
  artist: 'Delta',
  startsAt: at(28),
  priceMin: 60,
  genre: 'Rock',
});
const november = makeConcert({ id: 'nov', artist: 'Eco', startsAt: at(5, 10), priceMin: 20 });
const noDate = makeConcert({ id: 'tbc', artist: 'Ánimo', startsAt: null, priceMin: 10 });
const ALL = [november, noDate, sunday, today, nextWeek, friday];

const ids = (filters: Partial<Filters>, goingCount: (c: Concert) => number = () => 0) =>
  applyFilters(ALL, { ...DEFAULT_FILTERS, ...filters }, goingCount).map((c) => c.id);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});
afterEach(() => {
  jest.useRealTimers();
});

const day = (d: number, month = 9) => new Date(2026, month, d).getTime();

describe('applyFilters · calendario', () => {
  it('sin fechas devuelve todo por fecha, con las fechas por confirmar al final', () => {
    expect(ids({})).toEqual(['hoy', 'vie', 'dom', 'sem', 'nov', 'tbc']);
  });

  it('incluye el primer y el último día del intervalo', () => {
    expect(ids({ dates: { from: day(23), to: day(25) } })).toEqual(['vie', 'dom']);
    expect(ids({ dates: { from: day(28), to: day(28) } })).toEqual(['sem']);
    expect(ids({ dates: { from: day(26), to: day(5, 10) } })).toEqual(['sem', 'nov']);
  });
});

describe('pickDay', () => {
  it('primer toque, un día; segundo posterior, cierra el intervalo', () => {
    const one = pickDay(null, day(23));
    expect(one).toEqual({ from: day(23), to: day(23) });
    expect(pickDay(one, day(27))).toEqual({ from: day(23), to: day(27) });
  });

  it('un día anterior o un intervalo ya cerrado empiezan de nuevo', () => {
    expect(pickDay({ from: day(23), to: day(23) }, day(20))).toEqual({
      from: day(20),
      to: day(20),
    });
    expect(pickDay({ from: day(23), to: day(27) }, day(30))).toEqual({
      from: day(30),
      to: day(30),
    });
  });
});

describe('dateRangeLabel', () => {
  it('un día, mismo mes y meses distintos', () => {
    expect(dateRangeLabel({ from: day(24), to: day(24) })).toBe('24 oct');
    expect(dateRangeLabel({ from: day(24), to: day(27) })).toBe('24 – 27 oct');
    expect(dateRangeLabel({ from: day(30), to: day(2, 10) })).toBe('30 oct – 2 nov');
  });
});

describe('applyFilters · género y precio', () => {
  it('filtra por varios géneros', () => {
    expect(ids({ genres: ['Rock'] })).toEqual(['vie', 'sem']);
    expect(ids({ genres: ['Rock', 'Pop'] })).toEqual(['vie', 'dom', 'sem']);
  });

  it('el precio máximo excluye los conciertos sin precio conocido', () => {
    expect(ids({ maxPrice: 20 })).toEqual(['vie', 'nov', 'tbc']);
  });
});

describe('applyFilters · orden', () => {
  it('por precio, con los desconocidos al final', () => {
    expect(ids({ sort: 'price' })).toEqual(['tbc', 'vie', 'nov', 'hoy', 'sem', 'dom']);
  });

  it('A – Z ignora mayúsculas y acentos', () => {
    expect(ids({ sort: 'name' })).toEqual(['vie', 'tbc', 'dom', 'hoy', 'sem', 'nov']);
  });

  it('por popularidad, y a igualdad por fecha', () => {
    const going = (c: { id: string }) => (c.id === 'sem' ? 5 : c.id === 'nov' ? 5 : 0);
    expect(ids({ sort: 'popular' }, going).slice(0, 3)).toEqual(['sem', 'nov', 'hoy']);
  });
});

describe('matchesQuery', () => {
  const fontaines = makeConcert({
    artist: 'Fontaines D.C. - D.C. EU TOUR 2026',
    venue: 'Sant Jordi Club',
    genre: 'Rock',
    support: 'CHALK',
  });

  it.each([
    ['', true],
    ['   ', true],
    ['fontaines', true],
    ['FONTAINES', true],
    ['fontaines dc', true], // sin puntos
    ['sant jordi', true], // por sala
    ['rock', true], // por género
    ['chalk', true], // por telonero
    ['fontaines apolo', false], // todas las palabras deben coincidir
    ['madonna', false],
  ])('"%s" → %s', (query, expected) => {
    expect(matchesQuery(fontaines, query)).toBe(expected);
  });

  it('ignora acentos en los dos sentidos', () => {
    const show = makeConcert({ artist: 'Poison Ruïn', venue: 'Sala Bóveda' });
    expect(matchesQuery(show, 'poison ruin')).toBe(true);
    expect(matchesQuery(show, 'bóveda')).toBe(true);
    expect(matchesQuery(makeConcert({ venue: 'Sala Boveda' }), 'bóveda')).toBe(true);
  });
});

describe('activeFilterCount', () => {
  it('cuenta orden, géneros y precio, pero no el "cuándo" ni "Mis días libres" (tienen su chip)', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(
      activeFilterCount({
        sort: 'price',
        dates: { from: day(21), to: day(21) },
        genres: ['Rock', 'Pop'],
        maxPrice: 50,
        freeDaysOnly: true,
      })
    ).toBe(4);
  });
});

describe('genresOf', () => {
  it('lista géneros únicos, ordenados y sin vacíos', () => {
    expect(genresOf(ALL)).toEqual(['Pop', 'Rock']);
  });
});

describe('quickRange', () => {
  // Miércoles 21 de octubre de 2026
  const today = day(21);

  it('hoy y mañana: un solo día', () => {
    expect(quickRange('today', today)).toEqual({ from: day(21), to: day(21) });
    expect(quickRange('tomorrow', today)).toEqual({ from: day(22), to: day(22) });
  });

  it('próxima semana: de lunes a domingo de la que viene', () => {
    expect(quickRange('nextWeek', today)).toEqual({ from: day(26), to: day(1, 10) });
    // Un domingo, la próxima empieza mañana
    expect(quickRange('nextWeek', day(25))).toEqual({ from: day(26), to: day(1, 10) });
    // Un lunes, la próxima es la siguiente, no esta
    expect(quickRange('nextWeek', day(26))).toEqual({ from: day(2, 10), to: day(8, 10) });
  });

  it('isQuickRange marca el chip solo si coincide exactamente', () => {
    expect(isQuickRange({ from: day(22), to: day(22) }, 'tomorrow', today)).toBe(true);
    expect(isQuickRange({ from: day(22), to: day(23) }, 'tomorrow', today)).toBe(false);
    expect(isQuickRange(null, 'today', today)).toBe(false);
  });
});

describe('applyFilters · Mis días libres', () => {
  // Hoy (21) trabajas, el viernes 23 sales del turno a tiempo, el domingo 25 libre
  const availability = (c: Concert) =>
    c.id === 'hoy' ? 'trabajas' : c.id === 'vie' ? 'tras-turno' : c.id === 'dom' ? 'libre' : null;

  it('deja libres y tras el turno; quita donde trabajas', () => {
    const result = applyFilters(
      [today, friday, sunday],
      { ...DEFAULT_FILTERS, freeDaysOnly: true },
      () => 0,
      availability
    ).map((c) => c.id);
    expect(result).toEqual(['vie', 'dom']);
  });

  it('sin turnos configurados (null) no quita nada', () => {
    expect(ids({ freeDaysOnly: true })).toEqual(ids({}));
  });

  it('apagado, no filtra aunque trabajes', () => {
    const result = applyFilters([today], DEFAULT_FILTERS, () => 0, availability);
    expect(result.map((c) => c.id)).toEqual(['hoy']);
  });
});
