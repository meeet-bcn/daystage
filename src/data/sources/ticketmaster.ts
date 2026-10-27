import type { Concert } from '@/data/concerts';
import { cleanName, isTestEvent, parseEventInfo } from '@/data/event-info';
import { formatDate, formatPriceRange, toTimestamp } from '@/data/format';
import type { EventPage, EventProvider, EventQuery } from '@/data/sources/types';

const API_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY;
// Conciertos por página: se piden más al llegar al final de la lista
const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  onsale: 'A la venta',
  offsale: 'Entradas no disponibles',
  cancelled: 'Cancelado',
  postponed: 'Aplazado',
  rescheduled: 'Cambio de fecha',
};

function pickImage(images: any[] = [], ratios: string[] = ['16_9']) {
  for (const ratio of ratios) {
    const matches = images
      .filter((i) => i.ratio === ratio)
      .sort((a, b) => a.width - b.width);
    if (matches.length > 0) {
      const best = matches.find((i) => i.width >= 1024) ?? matches[matches.length - 1];
      return best.url as string;
    }
  }
  return images[0]?.url ?? '';
}

async function fetchEvents({ page, keyword }: EventQuery): Promise<EventPage> {
  if (!API_KEY) throw new Error('Falta la clave de Ticketmaster');

  const url =
    'https://app.ticketmaster.com/discovery/v2/events.json' +
    `?apikey=${encodeURIComponent(API_KEY)}` +
    '&city=Barcelona&countryCode=ES&classificationName=music' +
    `&sort=date,asc&size=${PAGE_SIZE}&page=${page}&locale=*` +
    (keyword ? `&keyword=${encodeURIComponent(keyword)}` : '');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error ${response.status}`);

  const data = await response.json();
  const events = data?._embedded?.events ?? [];
  const totalPages: number = data?.page?.totalPages ?? 0;

  const realEvents = events.filter((e: any) => !isTestEvent(e.name ?? ''));

  return { concerts: realEvents.map(toConcert), hasMore: page + 1 < totalPages };
}

/**
 * El evento de un enlace de su web (al pegarlo en «Añadir concierto»). El id
 * de la web no es el de la API: se busca por las palabras del enlace y se
 * elige el evento cuya URL lleva ese id. null si no aparece.
 */
export async function fetchTicketmasterByWebUrl(webId: string, keyword: string): Promise<Concert | null> {
  if (!API_KEY || !keyword) return null;
  const response = await fetch(
    'https://app.ticketmaster.com/discovery/v2/events.json' +
      `?apikey=${encodeURIComponent(API_KEY)}&countryCode=ES&size=50&locale=*` +
      `&keyword=${encodeURIComponent(keyword)}`
  );
  if (!response.ok) return null;
  const events: any[] = (await response.json())?._embedded?.events ?? [];
  const match = events.find((e) => typeof e.url === 'string' && e.url.includes(webId));
  return match ? toConcert(match) : null;
}

function toConcert(e: any): Concert {
  const v = e._embedded?.venues?.[0];
  const details = parseEventInfo(e.description, e.info, e.pleaseNote);
  const lat = parseFloat(v?.location?.latitude);
  const lng = parseFloat(v?.location?.longitude);
  const genre = e.classifications?.[0]?.genre?.name;
  const cityLine = [v?.postalCode, v?.city?.name].filter(Boolean).join(' ');
  const range = e.priceRanges?.[0];
  const priceMin: number | null = range?.min ?? null;
  const price = priceMin != null ? formatPriceRange(priceMin, range.max, range.currency) : '';

  return {
    id: `ticketmaster-${e.id}`,
    artist: cleanName(e.name ?? ''),
    venue: v?.name ?? 'Sala por confirmar',
    date: formatDate(e.dates?.start?.localDate, e.dates?.start?.localTime),
    startsAt: toTimestamp(e.dates?.start?.localDate, e.dates?.start?.localTime),
    going: 0,
    offers: [{ source: 'ticketmaster', url: e.url, price, priceMin }],
    image: pickImage(e.images, ['16_9']),
    hero: pickImage(e.images, ['3_2', '4_3', '16_9']),
    address: [v?.address?.line1, cityLine].filter(Boolean).join(', '),
    latitude: Number.isNaN(lat) ? null : lat,
    longitude: Number.isNaN(lng) ? null : lng,
    seatmap: e.seatmap?.staticUrl ?? '',
    info: details.about,
    doors: details.doors,
    support: details.support,
    ages: details.ages,
    price,
    priceMin,
    genre: genre && genre !== 'Undefined' ? genre : '',
    status: STATUS_LABELS[e.dates?.status?.code] ?? '',
  };
}

export const ticketmaster: EventProvider = { source: 'ticketmaster', fetchEvents };
