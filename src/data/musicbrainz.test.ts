import { describe, expect, it } from '@jest/globals';

import {
  LOOKUP_FONTAINES,
  SEARCH_FONTAINES,
  SEARCH_JOE_JACKSON,
  SEARCH_STORMY,
} from '@/data/__fixtures__/musicbrainz';
import { linkKind, parseArtist, pickArtist } from '@/data/musicbrainz';

describe('pickArtist', () => {
  it('acepta el único artista con el nombre exacto', () => {
    expect(pickArtist(SEARCH_FONTAINES, 'Fontaines D.C.')?.name).toBe('Fontaines D.C.');
    expect(pickArtist(SEARCH_FONTAINES, 'FONTAINES DC')?.name).toBe('Fontaines D.C.');
  });

  it('no se fía de la puntuación: "Stormy Six" no es "Stormy"', () => {
    const picked = pickArtist(SEARCH_STORMY, 'Stormy', 'Hip-Hop/Rap');
    expect(picked?.name).toBe('Stormy');
  });

  it('desempata homónimos por el género del concierto', () => {
    expect(pickArtist(SEARCH_STORMY, 'Stormy', 'Hip-Hop/Rap')?.disambiguation).toBe('Moroccan hip-hop');
  });

  it('ante homónimos sin pista de género, no elige a ninguno', () => {
    expect(pickArtist(SEARCH_STORMY, 'Stormy')).toBeNull();
    expect(pickArtist(SEARCH_STORMY, 'Stormy', 'Country')).toBeNull();
  });

  it('elige al homónimo con una puntuación claramente mayor', () => {
    expect(pickArtist(SEARCH_JOE_JACKSON, 'Joe Jackson')?.disambiguation).toBe('English musician');
  });

  it('ignora el artículo "The" inicial', () => {
    const search = { artists: [{ id: 'c', name: 'The Chameleons', score: 100 }] };
    expect(pickArtist(search, 'Chameleons')?.id).toBe('c');
    expect(pickArtist({ artists: [{ id: 'c', name: 'Chameleons', score: 100 }] }, 'The Chameleons')?.id).toBe(
      'c'
    );
  });

  it('devuelve null si nadie se llama exactamente así', () => {
    expect(pickArtist(SEARCH_FONTAINES, 'Fontaines')).toBeNull();
    expect(pickArtist({ artists: [] }, 'Fontaines D.C.')).toBeNull();
    expect(pickArtist({}, 'Fontaines D.C.')).toBeNull();
  });
});

describe('parseArtist', () => {
  const info = parseArtist(LOOKUP_FONTAINES);

  it('traduce tipo y país, y saca el año de inicio', () => {
    expect(info).toMatchObject({
      name: 'Fontaines D.C.',
      type: 'Grupo',
      country: 'Irlanda',
      since: '2014',
    });
  });

  it('ordena los géneros por votos y se queda con 4', () => {
    expect(info.genres).toHaveLength(4);
    expect(info.genres[0]).toMatch(/^Post-punk$/);
    expect(info.genres.every((g) => g[0] === g[0].toUpperCase())).toBe(true);
  });

  it('elige un enlace por tipo, en orden, empezando por la web oficial como "web"', () => {
    expect(info.links.map((l) => l.kind)).toEqual([
      'spotify',
      'apple',
      'youtube',
      'instagram',
      'bandcamp',
      'soundcloud',
      'web',
    ]);
    expect(info.links.find((l) => l.kind === 'web')?.url).toBe('https://fontainesdc.com/');
    expect(info.links.find((l) => l.kind === 'spotify')?.url).toBe(
      'https://open.spotify.com/artist/3SXwqSqAoBz9WCI9PDQzY6'
    );
  });

  it('en solistas no da año: sería el de nacimiento', () => {
    const person = parseArtist({ id: 'j', name: 'Joe Jackson', type: 'Person', 'life-span': { begin: '1954-08-11' } });
    expect(person.type).toBe('Solista');
    expect(person.since).toBe('');
  });

  it('tolera fichas casi vacías', () => {
    expect(parseArtist({ id: 'x', name: 'Nadie' })).toEqual({
      mbid: 'x',
      name: 'Nadie',
      type: '',
      country: '',
      since: '',
      genres: [],
      links: [],
    });
  });
});

describe('linkKind', () => {
  it.each([
    ['https://open.spotify.com/artist/1', 'spotify'],
    ['https://music.apple.com/es/artist/1', 'apple'],
    ['https://itunes.apple.com/us/artist/id1', 'apple'],
    ['https://www.youtube.com/channel/UC1', 'youtube'],
    ['https://www.instagram.com/band/', 'instagram'],
    ['https://www.tiktok.com/@band', 'tiktok'],
    ['https://band.bandcamp.com/', 'bandcamp'],
    ['https://soundcloud.com/band', 'soundcloud'],
    ['https://music.youtube.com/channel/UC1', null], // YouTube Music no es el canal
    ['https://www.discogs.com/artist/1', null],
    ['no es una url', null],
  ])('%s → %s', (url, kind) => {
    expect(linkKind(url)).toBe(kind);
  });
});
