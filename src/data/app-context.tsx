import { Image } from 'expo-image';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Concert, fetchConcerts } from '@/data/concerts';
import { applyFilters, DEFAULT_FILTERS, Filters, genresOf } from '@/data/filters';
import { mergeConcerts } from '@/data/merge';
import { splitPlans } from '@/data/plans';
import { EMPTY_PROFILE, Profile } from '@/data/profile';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/data/storage';

/** Mensaje del chat de un concierto. */
export type ChatMessage = { id: string; text: string; sentAt: number };

type AppState = {
  /** Conciertos cargados hasta ahora (se piden por páginas, por fecha). */
  concerts: Concert[];
  /** Cargando la primera página. */
  loading: boolean;
  error: string | null;
  /** Pide la siguiente página, si quedan y no se está pidiendo ya. */
  loadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  /** Fecha (ms) del último concierto de las páginas cargadas: hasta ahí está todo. */
  loadedUntil: number | null;
  /** Suma conciertos de fuera de las páginas (p. ej. de una búsqueda) para poder abrirlos. */
  addConcerts: (extra: Concert[]) => void;
  /**
   * Vacía la caché: se queda solo con la primera página (lo demás se vuelve a
   * pedir al bajar) y libera las fotos de la memoria. Al quitar las fechas.
   */
  trimConcerts: () => void;
  isGoing: (id: string) => boolean;
  toggleGoing: (concert: Concert) => void;
  goingCount: (concert: Concert) => number;
  /** Todos los conciertos a los que has dicho "Voy", también los ya pasados. */
  plans: Concert[];
  /** Planes que aún no han pasado, el más cercano primero (pestaña meeet in). */
  myConcerts: Concert[];

  profile: Profile;
  updateProfile: (changes: Partial<Profile>) => void;

  filters: Filters;
  setFilters: (update: (current: Filters) => Filters) => void;
  resetFilters: () => void;
  /** Conciertos de Inicio con filtros y orden aplicados. */
  visibleConcerts: Concert[];
  genres: string[];

  /**
   * Chat de cada concierto (se abre desde Meeet in). Aún no hay servidor: los
   * mensajes son solo los tuyos y viven en memoria hasta cerrar la app.
   */
  messagesFor: (id: string) => ChatMessage[];
  sendMessage: (id: string, text: string) => void;

  /** Mensajes de chat sin leer por concierto. Aún no hay chat real: siempre vacío. */
  unreadCount: (id: string) => number;
  unreadTotal: number;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Páginas tal como llegan de las ticketeras; se fusionan todas juntas abajo
  const [raw, setRaw] = useState<Concert[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadedUntil, setLoadedUntil] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita pedir la misma página dos veces si el scroll avisa varias veces seguidas
  const requesting = useRef(false);
  // Lo que trajo la primera página: es lo que queda al vaciar la caché
  const firstPage = useRef<{ ids: Set<string>; hasMore: boolean; until: number | null } | null>(
    null
  );
  // Sube al vaciar la caché: una respuesta pedida antes ya no vale
  const generation = useRef(0);
  // Copia de cada concierto al decir "Voy": la API solo trae conciertos
  // futuros, así que los ya pasados solo existen aquí (y en el móvil)
  const [myEvents, setMyEvents] = useState<Record<string, Concert>>(() =>
    loadJSON(STORAGE_KEYS.plans, {})
  );
  const [profile, setProfile] = useState<Profile>(() => ({
    ...EMPTY_PROFILE,
    ...loadJSON(STORAGE_KEYS.profile, {}),
  }));
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [unread] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const loadPage = useCallback((page: number) => {
    if (requesting.current) return;
    requesting.current = true;
    const requestedIn = generation.current;
    if (page > 0) setLoadingMore(true);
    fetchConcerts({ page })
      .then((result) => {
        if (requestedIn !== generation.current) return;
        const until = lastDate(result.concerts);
        if (page === 0) {
          firstPage.current = {
            ids: new Set(result.concerts.map((c) => c.id)),
            hasMore: result.hasMore,
            until,
          };
        }
        setLoadedUntil((current) => Math.max(current ?? 0, until ?? 0) || null);
        // Si las fechas se mueven entre páginas puede repetirse alguno
        setRaw((current) => withoutRepeats(current, result.concerts));
        setHasMore(result.hasMore);
        setNextPage(page + 1);
      })
      .catch((e) => {
        // Sin la primera página no hay lista; si falla otra, se reintenta al volver a bajar
        if (page === 0) setError(e.message);
      })
      .finally(() => {
        requesting.current = false;
        setLoading(false);
        setLoadingMore(false);
      });
  }, []);

  useEffect(() => loadPage(0), [loadPage]);

  // Estable: la búsqueda lo usa dentro de un efecto
  const addConcerts = useCallback(
    (extra: Concert[]) => setRaw((current) => withoutRepeats(current, extra)),
    []
  );

  const trimConcerts = useCallback(() => {
    const first = firstPage.current;
    if (!first) return;
    generation.current += 1;
    requesting.current = false;
    setLoadingMore(false);
    setRaw((current) => current.filter((c) => first.ids.has(c.id)));
    setNextPage(1);
    setHasMore(first.hasMore);
    setLoadedUntil(first.until);
    // Solo la memoria: la caché en disco evita volver a descargar las fotos
    Image.clearMemoryCache();
  }, []);

  const concerts = useMemo(() => mergeConcerts(raw), [raw]);

  useEffect(() => saveJSON(STORAGE_KEYS.plans, myEvents), [myEvents]);
  useEffect(() => saveJSON(STORAGE_KEYS.profile, profile), [profile]);

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
      loadMore: () => {
        if (hasMore && !loading && !error) loadPage(nextPage);
      },
      hasMore,
      loadingMore,
      loadedUntil,
      addConcerts,
      trimConcerts,
      isGoing: (id) => id in myEvents,
      toggleGoing: (concert) =>
        setMyEvents(({ [concert.id]: existing, ...rest }) =>
          existing ? rest : { ...rest, [concert.id]: concert }
        ),
      goingCount,
      plans,
      myConcerts,

      profile,
      updateProfile: (changes) => setProfile((current) => ({ ...current, ...changes })),

      filters,
      setFilters,
      resetFilters: () => setFilters(DEFAULT_FILTERS),
      visibleConcerts: applyFilters(concerts, filters, goingCount),
      genres: genresOf(concerts),

      messagesFor: (id) => messages[id] ?? [],
      sendMessage: (id, text) => {
        const message = { id: `${Date.now()}`, text, sentAt: Date.now() };
        setMessages((current) => ({ ...current, [id]: [...(current[id] ?? []), message] }));
      },

      unreadCount,
      unreadTotal: myConcerts.reduce((sum, c) => sum + unreadCount(c.id), 0),
    };
  }, [
    concerts,
    loading,
    error,
    hasMore,
    loadingMore,
    loadedUntil,
    nextPage,
    loadPage,
    addConcerts,
    trimConcerts,
    myEvents,
    profile,
    filters,
    unread,
    messages,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Fecha del último concierto con fecha de la lista, o null. */
function lastDate(concerts: Concert[]) {
  const dates = concerts.map((c) => c.startsAt).filter((t): t is number => t != null);
  return dates.length > 0 ? Math.max(...dates) : null;
}

/** `current` más los de `extra` que aún no estén (por id). */
function withoutRepeats(current: Concert[], extra: Concert[]) {
  const seen = new Set(current.map((c) => c.id));
  const fresh = extra.filter((c) => !seen.has(c.id));
  return fresh.length > 0 ? [...current, ...fresh] : current;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
