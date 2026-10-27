// Eventos propios (los añade la gente en la app): públicos y privados a los
// que tienes acceso, desde Supabase. Llegan todos en la primera página.

import { fetchUserEvents } from '@/data/user-events-service';
import type { EventProvider } from '@/data/sources/types';

export const user: EventProvider = {
  source: 'user',
  fetchEvents: async ({ page, keyword }) => {
    if (page > 0) return { concerts: [], hasMore: false };
    return { concerts: await fetchUserEvents(keyword), hasMore: false };
  },
};
