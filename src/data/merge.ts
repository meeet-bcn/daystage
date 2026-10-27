// Une los conciertos de todas las ticketeras: si el mismo concierto (mismo
// día, misma sala, mismo artista) está en varias, queda uno solo con todas
// sus ofertas de compra.

import type { Concert, TicketOffer } from '@/data/concerts';
import { compactText as normalize, headlinerName } from '@/data/text';

// "Fontaines D.C. - D.C. EU TOUR 2026" → "fontainesdc"; "Niall Horan: Dinner Party" → "niallhoran"
export function headliner(name: string) {
  return normalize(headlinerName(name));
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * Id del concierto en el servidor (y de su sala de chat): día local + sala +
 * artista principal, normalizados, como compara `isSameConcert`. Así el mismo
 * concierto da el mismo id en todos los móviles, venga de la fuente que venga.
 * Solo [a-z0-9_], para que sirva también de carpeta en Storage.
 *   "Fontaines D.C." en "Sala Apolo" el 31/10/2026 → "20261031_salaapolo_fontainesdc"
 */
export function canonicalConcertId(concert: Pick<Concert, 'startsAt' | 'venue' | 'artist'>) {
  const d = concert.startsAt == null ? null : new Date(concert.startsAt);
  const day = d ? `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` : 'sinfecha';
  const venue = normalize(concert.venue).slice(0, 40) || 'sinsala';
  const artist = (headliner(concert.artist) || normalize(concert.artist)).slice(0, 60) || 'sinartista';
  return `${day}_${venue}_${artist}`;
}

function sameArtist(a: string, b: string) {
  const [ha, hb] = [headliner(a), headliner(b)];
  if (ha === hb) return true;
  // Una fuente puede llamarlo "Carlangas" y otra "Vida Records & Friends: Carlangas"
  const [na, nb] = [normalize(a), normalize(b)];
  return (hb.length >= 4 && na.includes(hb)) || (ha.length >= 4 && nb.includes(ha));
}

function distanceKm(a: Concert, b: Concert) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return Infinity;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function sameVenue(a: Concert, b: Concert) {
  const [va, vb] = [normalize(a.venue), normalize(b.venue)];
  if (va && vb && (va.includes(vb) || vb.includes(va))) return true;
  return distanceKm(a, b) < 0.3;
}

function sameDay(a: Concert, b: Concert) {
  if (a.startsAt == null || b.startsAt == null) return false;
  return new Date(a.startsAt).toDateString() === new Date(b.startsAt).toDateString();
}

export function isSameConcert(a: Concert, b: Concert) {
  return sameDay(a, b) && sameVenue(a, b) && sameArtist(a.artist, b.artist);
}

// Los valores desconocidos (null) van siempre al final
function compareNullable(a: number | null, b: number | null) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return a - b;
}

/** Ofertas sin repetir ticketera, la más barata primero. */
function mergeOffers(a: TicketOffer[], b: TicketOffer[]) {
  const bySource = new Map<string, TicketOffer>();
  for (const offer of [...a, ...b]) {
    if (!bySource.has(offer.source)) bySource.set(offer.source, offer);
  }
  return [...bySource.values()].sort((x, y) => compareNullable(x.priceMin, y.priceMin));
}

/** Completa `base` con lo que le falte de `extra`; `base` tiene prioridad. */
function combine(base: Concert, extra: Concert): Concert {
  const offers = mergeOffers(base.offers, extra.offers);
  const cheapest = offers.find((o) => o.priceMin != null);
  const hasCoords = base.latitude != null && base.longitude != null;

  return {
    ...base,
    image: base.image || extra.image,
    hero: base.hero || extra.hero,
    address: base.address || extra.address,
    latitude: hasCoords ? base.latitude : extra.latitude,
    longitude: hasCoords ? base.longitude : extra.longitude,
    seatmap: base.seatmap || extra.seatmap,
    info: base.info || extra.info,
    doors: base.doors || extra.doors,
    support: base.support || extra.support,
    ages: base.ages || extra.ages,
    genre: base.genre || extra.genre,
    status: base.status || extra.status,
    going: Math.max(base.going, extra.going),
    offers,
    priceMin: cheapest?.priceMin ?? null,
    price: cheapest ? (offers.length > 1 ? `Desde ${cheapest.price}` : cheapest.price) : '',
  };
}

/** `concerts` llega en orden de prioridad de fuente; devuelve sin duplicados y por fecha. */
export function mergeConcerts(concerts: Concert[]) {
  const merged: Concert[] = [];

  for (const concert of concerts) {
    const index = merged.findIndex((m) => isSameConcert(m, concert));
    if (index === -1) merged.push(concert);
    else merged[index] = combine(merged[index], concert);
  }

  return merged.sort((a, b) => compareNullable(a.startsAt, b.startsAt));
}
