import { describe, expect, it } from '@jest/globals';

import { fromSource, makeConcert } from '@/data/__fixtures__/concert';
import { canonicalConcertId, isSameConcert, mergeConcerts } from '@/data/merge';

const HOUR = 60 * 60 * 1000;

const fontaines = makeConcert({
  id: 'ticketmaster-fon',
  artist: 'Fontaines D.C. - D.C. EU TOUR 2026',
  venue: 'Sant Jordi Club',
  latitude: 41.363,
  longitude: 2.152,
  image: 'tm.jpg',
});

describe('isSameConcert', () => {
  it('reconoce el mismo concierto escrito distinto en otra ticketera', () => {
    expect(isSameConcert(fontaines, { ...fontaines, artist: 'Fontaines D.C.' })).toBe(true);
    expect(isSameConcert(fontaines, { ...fontaines, artist: 'FONTAINES DC' })).toBe(true);
    expect(isSameConcert(fontaines, { ...fontaines, venue: 'Jordi Club' })).toBe(true);
  });

  it('acepta otra sala con el mismo nombre si está en la misma ubicación', () => {
    expect(isSameConcert(fontaines, { ...fontaines, venue: 'Palau Sant Jordi - Club' })).toBe(true);
    expect(
      isSameConcert(fontaines, { ...fontaines, venue: 'Otra', startsAt: fontaines.startsAt! + HOUR })
    ).toBe(true);
  });

  it('une al cabeza de cartel con el nombre largo del evento', () => {
    const show = makeConcert({ artist: 'Vida Records & Friends: Carlangas' });
    expect(isSameConcert(show, { ...show, artist: 'Carlangas' })).toBe(true);
  });

  it('no une conciertos de otro día, otro artista u otra sala', () => {
    expect(isSameConcert(fontaines, { ...fontaines, startsAt: fontaines.startsAt! + 24 * HOUR })).toBe(
      false
    );
    expect(isSameConcert(fontaines, { ...fontaines, artist: 'Neck Deep' })).toBe(false);
    expect(
      isSameConcert(fontaines, {
        ...fontaines,
        venue: 'Razzmatazz',
        latitude: 41.398,
        longitude: 2.191,
      })
    ).toBe(false);
  });

  it('no une conciertos sin fecha', () => {
    const undated = { ...fontaines, startsAt: null };
    expect(isSameConcert(undated, undated)).toBe(false);
  });
});

describe('mergeConcerts', () => {
  it('junta las ofertas, la más barata primero, y completa los datos que faltan', () => {
    const [merged, ...rest] = mergeConcerts([
      fontaines,
      fromSource(fontaines, 'dice', 35, { artist: 'Fontaines D.C.', image: '', info: 'Reseña DICE' }),
      fromSource(fontaines, 'fever', 39, { artist: 'FONTAINES DC', latitude: null, longitude: null }),
    ]);

    expect(rest).toHaveLength(0);
    expect(merged.offers.map((o) => o.source)).toEqual(['dice', 'fever', 'ticketmaster']);
    expect(merged.price).toBe('Desde 35 €');
    expect(merged.priceMin).toBe(35);
    // La primera fuente manda; las demás solo rellenan huecos
    expect(merged.id).toBe('ticketmaster-fon');
    expect(merged.artist).toBe('Fontaines D.C. - D.C. EU TOUR 2026');
    expect(merged.image).toBe('tm.jpg');
    expect(merged.info).toBe('Reseña DICE');
  });

  it('no repite una ticketera que aparece dos veces', () => {
    const [merged] = mergeConcerts([fontaines, { ...fontaines, id: 'ticketmaster-fon-2' }]);
    expect(merged.offers).toHaveLength(1);
  });

  it('deja separados los conciertos distintos y los ordena por fecha', () => {
    const later = makeConcert({ id: 'b', artist: 'Lido Pimienta', startsAt: fontaines.startsAt! + 48 * HOUR });
    const undated = makeConcert({ id: 'c', artist: 'Por confirmar', startsAt: null });
    const result = mergeConcerts([undated, later, fontaines, fromSource(later, 'dice', 20, { startsAt: later.startsAt! + 24 * HOUR })]);
    expect(result.map((c) => c.id)).toEqual(['ticketmaster-fon', 'b', 'dice-b', 'c']);
  });
});

describe('canonicalConcertId', () => {
  const at = (h: number) => new Date(2026, 9, 31, h, 0).getTime();

  it('día local + sala + artista principal, solo [a-z0-9_]', () => {
    const id = canonicalConcertId({
      artist: 'Fontaines D.C. - D.C. EU TOUR 2026',
      venue: 'Sant Jordi Club',
      startsAt: at(21),
    });
    expect(id).toBe('20261031_santjordiclub_fontainesdc');
    expect(id).toMatch(/^[a-z0-9_]{3,120}$/);
  });

  it('el mismo concierto desde dos fuentes da el mismo id (hora y acentos aparte)', () => {
    const a = canonicalConcertId({ artist: 'Rosalía', venue: 'Palau Sant Jordi', startsAt: at(21) });
    const b = canonicalConcertId({ artist: 'ROSALIA', venue: 'Palau Sant Jordi', startsAt: at(20) });
    expect(a).toBe(b);
  });

  it('otro día u otra sala, otro id', () => {
    const base = { artist: 'Rosalía', venue: 'Palau Sant Jordi', startsAt: at(21) };
    expect(canonicalConcertId(base)).not.toBe(
      canonicalConcertId({ ...base, startsAt: new Date(2026, 10, 1, 21).getTime() })
    );
    expect(canonicalConcertId(base)).not.toBe(canonicalConcertId({ ...base, venue: 'Razzmatazz' }));
  });

  it('sin fecha, sala o artista sigue siendo un id válido y corto', () => {
    const id = canonicalConcertId({ artist: '', venue: '', startsAt: null });
    expect(id).toBe('sinfecha_sinsala_sinartista');
    const long = canonicalConcertId({ artist: 'x'.repeat(300), venue: 'y'.repeat(300), startsAt: at(21) });
    expect(long.length).toBeLessThanOrEqual(120);
  });
});
