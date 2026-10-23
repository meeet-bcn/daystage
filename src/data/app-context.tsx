import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { Concert, fetchConcerts } from '@/data/concerts';
import { applyFilters, DEFAULT_FILTERS, Filters, genresOf } from '@/data/filters';

type AppState = {
  concerts: Concert[];
  loading: boolean;
  error: string | null;
  isGoing: (id: string) => boolean;
  toggleGoing: (id: string) => void;
  goingCount: (concert: Concert) => number;
  /** Conciertos a los que vas, ordenados por fecha (pestaña meeet in). */
  myConcerts: Concert[];

  filters: Filters;
  setFilters: (update: (current: Filters) => Filters) => void;
  resetFilters: () => void;
  /** Conciertos de Inicio con filtros y orden aplicados. */
  visibleConcerts: Concert[];
  genres: string[];

  /** Mensajes de chat sin leer por concierto. Aún no hay chat: siempre vacío. */
  unreadCount: (id: string) => number;
  unreadTotal: number;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [unread] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchConcerts()
      .then(setConcerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AppState>(() => {
    const goingCount = (c: Concert) => c.going + (myEvents.includes(c.id) ? 1 : 0);
    const unreadCount = (id: string) => unread[id] ?? 0;
    const myConcerts = concerts.filter((c) => myEvents.includes(c.id));

    return {
      concerts,
      loading,
      error,
      isGoing: (id) => myEvents.includes(id),
      toggleGoing: (id) =>
        setMyEvents((current) =>
          current.includes(id) ? current.filter((e) => e !== id) : [...current, id]
        ),
      goingCount,
      myConcerts,

      filters,
      setFilters,
      resetFilters: () => setFilters(DEFAULT_FILTERS),
      visibleConcerts: applyFilters(concerts, filters, goingCount),
      genres: genresOf(concerts),

      unreadCount,
      unreadTotal: myConcerts.reduce((sum, c) => sum + unreadCount(c.id), 0),
    };
  }, [concerts, loading, error, myEvents, filters, unread]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
