import { describe, expect, it } from '@jest/globals';

import { parseSetlists } from '@/data/setlists';

const raw = {
  setlist: [
    {
      id: 'a',
      eventDate: '12-06-2025',
      artist: { name: 'Fontaines D.C.' },
      venue: { name: 'Parc del Fòrum', city: { name: 'Barcelona', country: { name: 'Spain' } } },
      tour: { name: 'Romance Tour' },
      sets: {
        set: [
          { song: [{ name: 'Romance' }, { name: 'Jackie Down the Line' }] },
          { song: [{ name: 'I Love You' }] },
        ],
      },
      url: 'https://www.setlist.fm/a',
    },
    {
      id: 'b',
      eventDate: '03-11-2025',
      artist: { name: 'Fontaines D.C.' },
      venue: { name: 'Razzmatazz', city: { name: 'Barcelona', country: { name: 'Spain' } } },
      sets: { set: [{ song: [{ name: 'Starburster' }] }] },
    },
    // Otro artista con nombre parecido, y un concierto sin canciones
    {
      id: 'c',
      eventDate: '01-01-2025',
      artist: { name: 'Fontaines' },
      sets: { set: [{ song: [{ name: 'X' }] }] },
    },
    { id: 'd', eventDate: '02-02-2025', artist: { name: 'Fontaines D.C.' }, sets: { set: [] } },
  ],
};

describe('parseSetlists', () => {
  it('del artista, con canciones, del más reciente al más antiguo', () => {
    const setlists = parseSetlists(raw, 'Fontaines D.C. - Romance Tour');
    expect(setlists.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('fecha, sala, ciudad, gira y todas las canciones de todos los sets', () => {
    const [, first] = parseSetlists(raw, 'Fontaines D.C.');
    expect(first).toEqual({
      id: 'a',
      date: '2025-06-12',
      venue: 'Parc del Fòrum',
      city: 'Barcelona, Spain',
      tour: 'Romance Tour',
      songs: ['Romance', 'Jackie Down the Line', 'I Love You'],
      url: 'https://www.setlist.fm/a',
    });
  });

  it('sin resultados, vacío', () => {
    expect(parseSetlists({}, 'Nadie')).toEqual([]);
  });
});
