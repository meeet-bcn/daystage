import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { Concert, fetchConcerts } from '@/data/concerts';
import { applyFilters, DEFAULT_FILTERS, Filters, genresOf } from '@/data/filters';
import { splitPlans } from '@/data/plans';
import { EMPTY_PROFILE, Profile } from '@/data/profile';

type AppState = {
  concerts: Concert[];
  loading: boolean;
  error: string | null;
  isGoing: (id: string) => boolean;
  toggleGoing: (concert: Concert) => void;
  goingCount: (concert: Concert) => number;
  /** Todos los conciertos a los que has dicho "Voy", también los ya pasados. */
  plans: Concert[];
  /** Planes que aún no han pasado, el más cercano primero (pestaña meeet in). */
  myConcerts: Concert[];

  profile: Profile;

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
  // Copia de cada concierto al decir "Voy": la API solo trae conciertos
  // futuros, así que los ya pasados solo existen aquí
  const [myEvents, setMyEvents] = useState<Record<string, Concert>>({});
  const [profile] = useState<Profile>(EMPTY_PROFILE);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [unread] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchConcerts()
      .then(setConcerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AppState>(() => {
    const goingCount = (c: Concert) => c.going + (myEvents[c.id] ? 1 : 0);
    const unreadCount = (id: string) => unread[id] ?? 0;
    // Datos frescos de la API si el concierto sigue en ella; si no, la copia
    const plans = Object.values(myEvents).map((saved) => concerts.find((c) => c.id === saved.id) ?? saved);
    const myConcerts = splitPlans(plans).upcoming;

    return {
      concerts,
      loading,
      error,
      isGoing: (id) => id in myEvents,
      toggleGoing: (concert) =>
        setMyEvents(({ [concert.id]: existing, ...rest }) =>
          existing ? rest : { ...rest, [concert.id]: concert }
        ),
      goingCount,
      plans,
      myConcerts,

      profile,

      filters,
      setFilters,
      resetFilters: () => setFilters(DEFAULT_FILTERS),
      visibleConcerts: applyFilters(concerts, filters, goingCount),
      genres: genresOf(concerts),

      unreadCount,
      unreadTotal: myConcerts.reduce((sum, c) => sum + unreadCount(c.id), 0),
    };
  }, [concerts, loading, error, myEvents, profile, filters, unread]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
