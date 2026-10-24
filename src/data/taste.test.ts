import { describe, expect, it } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import { MUSIC_TASTES } from '@/data/profile';
import {
  buildDeck,
  pickLanguages,
  TASTE_ARTISTS,
  TASTE_PICKS,
  tasteGenre,
  tasteWeights,
  topTastes,
} from '@/data/taste';

const NOW = new Date(2026, 9, 24, 12, 0).getTime();
const day = (d: number) => new Date(2026, 9, d, 21, 0).getTime();
const none = { plans: [], wishlist: [], swipes: {} };

describe('catálogo', () => {
  it('hay de sobra para elegir 5, con estilos de MUSIC_TASTES e imagen', () => {
    expect(TASTE_ARTISTS.length).toBeGreaterThanOrEqual(TASTE_PICKS * 4);
    for (const a of TASTE_ARTISTS) {
      expect(a.genres.every((g) => MUSIC_TASTES.includes(g))).toBe(true);
      expect(a.image).toMatch(/^https:\/\//);
    }
    expect(new Set(TASTE_ARTISTS.map((a) => a.id)).size).toBe(TASTE_ARTISTS.length);
  });

  it('artistas en catalán, en español y en inglés', () => {
    for (const lang of ['ca', 'es', 'en']) {
      expect(TASTE_ARTISTS.some((a) => a.language === lang)).toBe(true);
    }
  });
});

describe('tasteGenre', () => {
  it.each([
    ['Alternative', 'Indie'],
    ['Hip-Hop/Rap', 'Hip hop'],
    ['Dance/Electronic', 'Electrónica'],
    ['Latin', 'Latino'],
    ['Ópera', 'Clásica'],
    ['Rock', 'Rock'],
    ['', ''],
  ])('%s → %s', (genre, expected) => {
    expect(tasteGenre(genre)).toBe(expected);
  });
});

describe('tasteWeights', () => {
  it('los artistas elegidos dan peso a sus estilos', () => {
    const w = tasteWeights({ picks: ['radiohead', 'manel'], ...none });
    expect(w.Indie).toBeGreaterThan(w.Rock);
    expect(w.Folk).toBeGreaterThan(0);
  });

  it('aprende de tus planes, deseos y cartas, sin bajar de cero', () => {
    const base = tasteWeights({ picks: ['radiohead'], ...none });
    const learned = tasteWeights({
      picks: ['radiohead'],
      plans: [makeConcert({ genre: 'Jazz' })],
      wishlist: [makeConcert({ genre: 'Latin' })],
      swipes: {
        a: { liked: true, genre: 'Alternative' },
        b: { liked: false, genre: 'Metal' },
      },
    });
    expect(learned.Jazz).toBeGreaterThan(0);
    expect(learned.Latino).toBeGreaterThan(0);
    expect(learned.Indie).toBeGreaterThan(base.Indie);
    expect(learned.Metal).toBe(0);
  });
});

describe('topTastes y pickLanguages', () => {
  it('estilos de más a menos, solo los que pesan', () => {
    expect(topTastes({ Rock: 1, Indie: 3, Jazz: 0 })).toEqual(['Indie', 'Rock']);
  });

  it('idiomas de los elegidos, el más repetido primero', () => {
    expect(pickLanguages(['manel', 'txarango', 'rosalia'])).toEqual(['ca', 'es']);
  });
});

describe('buildDeck', () => {
  const indie = makeConcert({ id: 'indie', genre: 'Alternative', startsAt: day(30) });
  const rock = makeConcert({ id: 'rock', genre: 'Rock', startsAt: day(25) });
  const jazz = makeConcert({ id: 'jazz', genre: 'Jazz', startsAt: day(26) });
  const past = makeConcert({ id: 'past', genre: 'Alternative', startsAt: day(20) });
  const options = { now: NOW, swiped: new Set<string>(), going: new Set<string>() };

  it('lo que más encaja primero; a igualdad, lo más cercano; sin los pasados', () => {
    const deck = buildDeck([rock, jazz, indie, past], { Indie: 3, Rock: 1 }, options);
    expect(deck.map((c) => c.id)).toEqual(['indie', 'rock', 'jazz']);
  });

  it('sin los ya deslizados ni a los que vas', () => {
    const deck = buildDeck(
      [rock, jazz, indie],
      { Indie: 3 },
      {
        ...options,
        swiped: new Set(['indie']),
        going: new Set(['rock']),
      }
    );
    expect(deck.map((c) => c.id)).toEqual(['jazz']);
  });
});
