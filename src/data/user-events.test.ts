import { describe, expect, it } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import {
  draftToRow,
  EMPTY_DRAFT,
  type EventDraft,
  findDuplicate,
  isUserEvent,
  rowToConcert,
  rowToDraft,
  type UserEventRow,
  userEventId,
  validateDraft,
} from '@/data/user-events';

// Europe/Madrid (scripts/jest-timezone.js)
const NOW = new Date(2026, 9, 27, 10, 0).getTime();

const draft = (over: Partial<EventDraft> = {}): EventDraft => ({
  ...EMPTY_DRAFT,
  title: 'Los Invento',
  date: '2026-11-14',
  startTime: '21:30',
  endTime: '00:30',
  venue: 'Sala Ejemplo',
  address: 'C/ Inventada, 1',
  city: 'Barcelona',
  genre: 'Rock',
  priceKind: 'from',
  price: '12,5',
  ticketUrl: 'https://entradas.example.com/los-invento',
  description: 'Gira de presentación.',
  visibility: 'public',
  ...over,
});

describe('validateDraft', () => {
  it('un borrador completo no tiene errores', () => {
    expect(validateDraft(draft(), NOW)).toEqual({});
  });

  it('pide lo imprescindible, también público o privado', () => {
    const e = validateDraft(EMPTY_DRAFT, NOW);
    expect(Object.keys(e).sort()).toEqual(['date', 'startTime', 'title', 'venue', 'visibility'].sort());
  });

  it('precio, horas, enlace y fechas pasadas', () => {
    expect(validateDraft(draft({ price: 'gratis' }), NOW).price).toBeDefined();
    expect(validateDraft(draft({ priceKind: 'free', price: '' }), NOW).price).toBeUndefined();
    expect(validateDraft(draft({ startTime: '9:30' }), NOW).startTime).toBeDefined();
    expect(validateDraft(draft({ endTime: '25:00' }), NOW).endTime).toBeDefined();
    expect(validateDraft(draft({ ticketUrl: 'entradas.com' }), NOW).ticketUrl).toBeDefined();
    expect(validateDraft(draft({ date: '2026-10-01' }), NOW).date).toBe('La fecha ya ha pasado.');
  });
});

describe('draftToRow', () => {
  it('fechas en ISO, fin al día siguiente si acaba de madrugada, precio en número', () => {
    const row = draftToRow(draft(), 'u1/foto.jpg');
    expect(row.starts_at).toBe(new Date(2026, 10, 14, 21, 30).toISOString());
    expect(row.ends_at).toBe(new Date(2026, 10, 15, 0, 30).toISOString());
    expect(row.price_min).toBe(12.5);
    expect(row.image_path).toBe('u1/foto.jpg');
    expect(row.visibility).toBe('public');
  });

  it('gratis = 0; sin precio = null; sin fin = null', () => {
    expect(draftToRow(draft({ priceKind: 'free' }), null).price_min).toBe(0);
    expect(draftToRow(draft({ priceKind: 'unknown' }), null).price_min).toBeNull();
    expect(draftToRow(draft({ endTime: '' }), null).ends_at).toBeNull();
  });
});

const row: UserEventRow = {
  id: '6b1f0c2e-0000-4000-8000-000000000001',
  created_by: 'user-a',
  visibility: 'private',
  title: 'Los Invento',
  venue: 'Sala Ejemplo',
  address: 'C/ Inventada, 1',
  city: 'Barcelona',
  latitude: null,
  longitude: null,
  starts_at: new Date(2026, 10, 14, 21, 30).toISOString(),
  ends_at: new Date(2026, 10, 15, 0, 30).toISOString(),
  genre: 'Rock',
  price_min: 0,
  ticket_url: '',
  image_path: null,
  description: 'Gira',
};

describe('rowToConcert', () => {
  it('como un concierto más: id con prefijo, fecha formateada, gratis y privado', () => {
    const c = rowToConcert(row, 'https://img/x.jpg');
    expect(c.id).toBe(`user-${row.id}`);
    expect(isUserEvent(c.id)).toBe(true);
    expect(userEventId(c.id)).toBe(row.id);
    expect(c.startsAt).toBe(new Date(2026, 10, 14, 21, 30).getTime());
    expect(c.date).toMatch(/14 nov.* · 21:30$/i);
    expect(c.priceMin).toBe(0);
    expect(c.price).toBe('Gratis');
    expect(c.offers).toEqual([{ source: 'user', url: '', price: 'Gratis', priceMin: 0 }]);
    expect(c.address).toBe('C/ Inventada, 1, Barcelona');
    expect(c.doors).toBe('Hasta las 00:30');
    expect(c.image).toBe('https://img/x.jpg');
    expect(c).toMatchObject({ visibility: 'private', createdBy: 'user-a' });
  });

  it('ida y vuelta: la fila otra vez como borrador', () => {
    expect(rowToDraft(row)).toMatchObject({
      date: '2026-11-14',
      startTime: '21:30',
      endTime: '00:30',
      priceKind: 'free',
      visibility: 'private',
    });
  });
});

describe('findDuplicate', () => {
  const existing = makeConcert({
    id: 'bcn-1',
    artist: 'LOS INVENTO - Gira 2026',
    venue: 'Sala Ejemplo (Barcelona)',
    startsAt: new Date(2026, 10, 14, 21, 0).getTime(),
    latitude: null,
    longitude: null,
  });

  it('avisa si ya hay uno ese día, en esa sala y con ese artista', () => {
    expect(findDuplicate(draft(), [existing])?.id).toBe('bcn-1');
  });

  it('otro día u otro artista, no', () => {
    expect(findDuplicate(draft({ date: '2026-11-15' }), [existing])).toBeNull();
    expect(findDuplicate(draft({ title: 'Otro Grupo' }), [existing])).toBeNull();
    expect(findDuplicate(draft({ startTime: '' }), [existing])).toBeNull();
  });
});
