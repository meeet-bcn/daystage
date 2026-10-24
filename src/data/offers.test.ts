import { describe, expect, it } from '@jest/globals';

import type { TicketOffer } from '@/data/concerts';
import { buyOffer, otherTicketOffers, sortedOffers } from '@/data/offers';

const tm: TicketOffer = { source: 'ticketmaster', url: 'https://tm', price: '30 €', priceMin: 30 };
const bcn: TicketOffer = { source: 'bcn', url: 'https://sala', price: '25 €', priceMin: 25 };
const fever: TicketOffer = { source: 'fever', url: 'https://fever', price: '28 €', priceMin: 28 };

describe('buyOffer', () => {
  it('Ticketmaster primero, aunque la agenda sea más barata', () => {
    expect(buyOffer([bcn, tm])).toBe(tm);
  });

  it('sin Ticketmaster, otra ticketera antes que la agenda', () => {
    expect(buyOffer([bcn, fever])).toBe(fever);
  });

  it('solo la agenda: su enlace; sin enlace, el siguiente que lo tenga', () => {
    expect(buyOffer([bcn])).toBe(bcn);
    expect(buyOffer([{ ...tm, url: '' }, bcn])).toBe(bcn);
  });
});

describe('otherTicketOffers', () => {
  it('nunca la agenda ni el enlace principal', () => {
    expect(otherTicketOffers([bcn, tm])).toEqual([]);
    expect(otherTicketOffers([bcn, fever, tm])).toEqual([fever]);
  });
});

describe('sortedOffers', () => {
  it('para las pastillas: Ticketmaster delante y la agenda detrás', () => {
    expect(sortedOffers([bcn, tm]).map((o) => o.source)).toEqual(['ticketmaster', 'bcn']);
  });
});
