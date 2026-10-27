// Eventos propios (funciones puras): conciertos que alguien añade porque no
// salen en las fuentes, públicos o privados. Borrador del formulario,
// validación, fila de Supabase (user_events) ↔ Concert y posibles duplicados.

import type { Concert } from '@/data/concerts';
import { formatDate } from '@/data/format';
import { isSameConcert } from '@/data/merge';
import { isDateKey, isTime } from '@/data/shifts';

export type Visibility = 'public' | 'private';

/** Lo que se rellena en el formulario. Fechas y horas como texto local. */
export type EventDraft = {
  title: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:MM'
  endTime: string; // '' o 'HH:MM'
  venue: string;
  address: string;
  city: string;
  genre: string;
  /** 'free' = gratis; 'from' = desde `price` €; 'unknown' = sin precio. */
  priceKind: 'free' | 'from' | 'unknown';
  price: string;
  ticketUrl: string;
  description: string;
  visibility: Visibility | null;
  /** Coordenadas del lugar, si se conocen (p. ej. de la web del evento): mapa en la ficha. */
  latitude?: number | null;
  longitude?: number | null;
};

export const EMPTY_DRAFT: EventDraft = {
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  address: '',
  city: 'Barcelona',
  genre: '',
  priceKind: 'unknown',
  price: '',
  ticketUrl: '',
  description: '',
  visibility: null,
};

export type DraftErrors = Partial<Record<keyof EventDraft, string>>;

const priceNumber = (text: string) => Number(text.replace(',', '.').trim());

/** Errores por campo (vacío = se puede guardar). `now` para no aceptar fechas pasadas. */
export function validateDraft(d: EventDraft, now = Date.now()): DraftErrors {
  const e: DraftErrors = {};
  if (d.title.trim().length < 2) e.title = 'Escribe el nombre del concierto o del artista.';
  if (!isDateKey(d.date)) e.date = 'Elige la fecha.';
  if (!isTime(d.startTime)) e.startTime = 'Escribe la hora como 21:00.';
  if (d.endTime && !isTime(d.endTime)) e.endTime = 'Escribe la hora como 23:30.';
  if (d.venue.trim().length < 2) e.venue = 'Escribe la sala o el lugar.';
  if (d.city.trim().length < 2) e.city = 'Escribe la ciudad.';
  if (d.priceKind === 'from') {
    const n = priceNumber(d.price);
    if (!d.price.trim() || Number.isNaN(n) || n < 0) e.price = 'Escribe el precio, por ejemplo 18.';
  }
  if (d.ticketUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(d.ticketUrl.trim())) {
    e.ticketUrl = 'El enlace debe empezar por https://';
  }
  if (!d.visibility) e.visibility = 'Elige si es público o privado.';
  if (!e.date && !e.startTime && startsAtOf(d) < now - 60 * 60_000) {
    e.date = 'La fecha ya ha pasado.';
  }
  return e;
}

/** Inicio en ms (hora local). */
export function startsAtOf(d: Pick<EventDraft, 'date' | 'startTime'>) {
  return new Date(`${d.date}T${d.startTime}:00`).getTime();
}

/** Fin en ms; si acaba "antes" de empezar, es al día siguiente. Sin hora de fin, null. */
export function endsAtOf(d: Pick<EventDraft, 'date' | 'startTime' | 'endTime'>) {
  if (!d.endTime) return null;
  const end = new Date(`${d.date}T${d.endTime}:00`).getTime();
  return end > startsAtOf(d) ? end : end + 24 * 60 * 60_000;
}

export type UserEventRow = {
  id: string;
  created_by: string;
  visibility: Visibility;
  title: string;
  venue: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string | null;
  genre: string;
  price_min: number | null;
  ticket_url: string;
  image_path: string | null;
  description: string;
};

/** Fila para insertar o actualizar (sin id ni creador: los pone el servidor). */
export function draftToRow(d: EventDraft, imagePath: string | null) {
  const ends = endsAtOf(d);
  return {
    visibility: d.visibility as Visibility,
    title: d.title.trim(),
    venue: d.venue.trim(),
    address: d.address.trim(),
    city: d.city.trim(),
    starts_at: new Date(startsAtOf(d)).toISOString(),
    ends_at: ends == null ? null : new Date(ends).toISOString(),
    genre: d.genre,
    price_min: d.priceKind === 'free' ? 0 : d.priceKind === 'from' ? priceNumber(d.price) : null,
    ticket_url: d.ticketUrl.trim(),
    image_path: imagePath,
    description: d.description.trim(),
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Al editar: la fila otra vez como borrador. */
export function rowToDraft(row: UserEventRow): EventDraft {
  const s = new Date(row.starts_at);
  const e = row.ends_at ? new Date(row.ends_at) : null;
  return {
    title: row.title,
    date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
    startTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
    endTime: e ? `${pad(e.getHours())}:${pad(e.getMinutes())}` : '',
    venue: row.venue,
    address: row.address,
    city: row.city,
    genre: row.genre,
    priceKind: row.price_min == null ? 'unknown' : row.price_min === 0 ? 'free' : 'from',
    price: row.price_min ? String(row.price_min) : '',
    ticketUrl: row.ticket_url,
    description: row.description,
    visibility: row.visibility,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

/** Prefijo de los ids de los eventos propios en la app. */
export const USER_EVENT_PREFIX = 'user-';
export const isUserEvent = (concertId: string) => concertId.startsWith(USER_EVENT_PREFIX);
export const userEventId = (concertId: string) => concertId.slice(USER_EVENT_PREFIX.length);

/** El evento como Concert (como las demás fuentes). `imageUrl`: la URL pública de su foto. */
export function rowToConcert(row: UserEventRow, imageUrl = ''): Concert {
  const s = new Date(row.starts_at);
  const localDate = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`;
  const localTime = `${pad(s.getHours())}:${pad(s.getMinutes())}:00`;
  const priceMin = row.price_min == null ? null : Number(row.price_min);
  const price = priceMin == null ? '' : priceMin === 0 ? 'Gratis' : `Desde ${priceMin} €`;
  const ends = row.ends_at ? new Date(row.ends_at) : null;
  return {
    id: `${USER_EVENT_PREFIX}${row.id}`,
    artist: row.title,
    venue: row.venue,
    date: formatDate(localDate, localTime),
    startsAt: s.getTime(),
    going: 0,
    offers: [{ source: 'user', url: row.ticket_url, price, priceMin }],
    image: imageUrl,
    hero: imageUrl,
    address: [row.address, row.city].filter(Boolean).join(', '),
    latitude: row.latitude,
    longitude: row.longitude,
    seatmap: '',
    info: row.description,
    doors: ends ? `Hasta las ${pad(ends.getHours())}:${pad(ends.getMinutes())}` : '',
    support: '',
    ages: '',
    price,
    priceMin,
    genre: row.genre,
    status: '',
    visibility: row.visibility,
    createdBy: row.created_by,
  };
}

/** Un concierto ya cargado que parece el mismo (mismo día, sala y artista, como merge.ts). */
export function findDuplicate(d: EventDraft, concerts: Concert[]) {
  if (!isDateKey(d.date) || !isTime(d.startTime)) return null;
  const probe = { venue: d.venue, artist: d.title, startsAt: startsAtOf(d), latitude: null, longitude: null };
  return concerts.find((c) => isSameConcert(c, probe as Concert)) ?? null;
}
