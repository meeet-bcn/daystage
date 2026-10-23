import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import type { Concert } from '@/data/concerts';
import {
  activeFilterCount,
  applyFilters,
  DEFAULT_FILTERS,
  Filters,
  genresOf,
  WhenKey,
} from '@/data/filters';

// Miércoles 21 de octubre de 2026, 12:00 (hora local)
const NOW = new Date(2026, 9, 21, 12, 0);
const at = (day: number, month = 9) => new Date(2026, month, day, 21, 0).getTime();

const today = makeConcert({ id: 'hoy', artist: 'Charlie', startsAt: at(21), priceMin: 40 });
const friday = makeConcert({ id: 'vie', artist: 'alfa', startsAt: at(23), priceMin: 15, genre: 'Rock' });
const sunday = makeConcert({ id: 'dom', artist: 'Bravo', startsAt: at(25), priceMin: null, genre: 'Pop' });
const nextWeek = makeConcert({ id: 'sem', artist: 'Delta', startsAt: at(28), priceMin: 60, genre: 'Rock' });
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

describe('applyFilters · cuándo', () => {
  it('sin filtro devuelve todo por fecha, con las fechas por confirmar al final', () => {
    expect(ids({})).toEqual(['hoy', 'vie', 'dom', 'sem', 'nov', 'tbc']);
  });

  it.each<[WhenKey, string[]]>([
    ['today', ['hoy']],
    ['weekend', ['vie', 'dom']],
    ['week', ['hoy', 'vie', 'dom']],
    ['month', ['hoy', 'vie', 'dom', 'sem']],
  ])('%s', (when, expected) => {
    expect(ids({ when })).toEqual(expected);
  });

  it('en sábado, "este finde" empieza hoy', () => {
    jest.setSystemTime(new Date(2026, 9, 24, 10, 0));
    expect(ids({ when: 'weekend' })).toEqual(['dom']);
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

describe('activeFilterCount', () => {
  it('cuenta orden, géneros y precio, pero no el "cuándo"', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(
      activeFilterCount({ sort: 'price', when: 'today', genres: ['Rock', 'Pop'], maxPrice: 50 })
    ).toBe(4);
  });
});

describe('genresOf', () => {
  it('lista géneros únicos, ordenados y sin vacíos', () => {
    expect(genresOf(ALL)).toEqual(['Pop', 'Rock']);
  });
});
