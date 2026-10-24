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

import type { ChatMessage } from '@/data/chat';
import { Concert, fetchConcerts } from '@/data/concerts';
import { applyFilters, DEFAULT_FILTERS, Filters, genresOf } from '@/data/filters';
import { mergeConcerts } from '@/data/merge';
import { splitPlans } from '@/data/plans';
import { EMPTY_PROFILE, loadProfile, Profile } from '@/data/profile';
import { DEFAULT_SETTINGS, Settings, withDefaults } from '@/data/settings';
import { Swipe, tasteWeights, topTastes } from '@/data/taste';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/data/storage';

export type { ChatMessage };

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
  /**
   * Hasta qué fecha (ms) está todo cargado de todas las fuentes, o null si ya
   * está todo. Las listas solo muestran hasta aquí (`concerts` incluye también
   * lo de más allá, para poder abrirlo y buscarlo).
   */
  loadedUntil: number | null;
  /** Suma conciertos de fuera de las páginas (p. ej. de una búsqueda) para poder abrirlos. */
  addConcerts: (extra: Concert[]) => void;
  /**
   * Vacía la caché: se queda solo con la primera página (lo demás se vuelve a
   * pedir al bajar) y libera las fotos de la memoria. Al quitar las fechas.
   */
  trimConcerts: () => void;
  /**
   * Tirar hacia abajo en Inicio: vuelve a pedir la primera página y deja solo
   * esa. Si falla, se queda la lista que había. Resuelve al terminar.
   */
  refreshConcerts: () => Promise<void>;
  isGoing: (id: string) => boolean;
  toggleGoing: (concert: Concert) => void;
  /**
   * El último "Meeet In!" que acabas de darle, para celebrarlo con brillos en
   * su foto. `at` distingue un toque de otro; se limpia al acabar la animación.
   */
  celebration: { id: string; at: number } | null;
  endCelebration: () => void;
  goingCount: (concert: Concert) => number;
  /** Todos los conciertos a los que has dicho "Voy", también los ya pasados. */
  plans: Concert[];
  /** Lista de deseos (corazón): conciertos que te interesan, por fecha. Guarda copia como los planes. */
  wishlist: Concert[];
  isWished: (id: string) => boolean;
  toggleWish: (concert: Concert) => void;
  /** Planes que aún no han pasado, el más cercano primero (pestaña meeet in). */
  myConcerts: Concert[];

  profile: Profile;
  updateProfile: (changes: Partial<Profile>) => void;

  settings: Settings;
  updateSettings: (changes: Partial<Settings>) => void;
  /** Ajustes › Borrar mis datos: planes, perfil, ajustes y chats de este móvil (y vuelve la bienvenida). */
  clearUserData: () => void;

  /** Descubrir: cartas deslizadas (derecha = te gusta) y si ya viste cómo funcionan. */
  swipes: Record<string, Swipe>;
  swipe: (concert: Concert, liked: boolean) => void;
  deckIntroSeen: boolean;
  finishDeckIntro: () => void;
  /** Peso de cada estilo según tus artistas, planes, deseos y cartas (se recalcula siempre). */
  tasteWeights: Record<string, number>;
  /** Tus estilos favoritos ahora mismo: los de Descubrir si los hay, si no los que elegiste. */
  myTastes: string[];

  /** Ya has pasado por las diapositivas de bienvenida (creando el perfil o no). */
  welcomeSeen: boolean;
  finishWelcome: () => void;

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
  /** Mensajes de una sala de chat (`chatKey`: una por concierto). */
  messagesFor: (room: string) => ChatMessage[];
  sendMessage: (room: string, text: string) => void;
  /** Foto o vídeo de la galería. */
  sendMedia: (room: string, media: { photo?: string; video?: string }) => void;
  /** Todo lo enviado en las salas de un concierto (general y de idiomas), por fecha. */
  messagesOfConcert: (concertId: string) => ChatMessage[];

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
  const [wishes, setWishes] = useState<Record<string, Concert>>(() =>
    loadJSON(STORAGE_KEYS.wishlist, {})
  );
  const [profile, setProfile] = useState<Profile>(() =>
    loadProfile(loadJSON(STORAGE_KEYS.profile, {}))
  );
  // La bienvenida se ve una vez; quien ya tenía perfil no la vuelve a ver
  const [welcomeSeen, setWelcomeSeen] = useState<boolean>(
    () => loadJSON(STORAGE_KEYS.onboarding, { welcomeSeen: profile.created }).welcomeSeen
  );
  const [settings, setSettings] = useState<Settings>(() =>
    withDefaults(loadJSON(STORAGE_KEYS.settings, {}))
  );
  const [discover, setDiscover] = useState<{
    swipes: Record<string, Swipe>;
    deckIntroSeen: boolean;
  }>(() => ({ swipes: {}, deckIntroSeen: false, ...loadJSON(STORAGE_KEYS.discover, {}) }));
  const [celebration, setCelebration] = useState<{ id: string; at: number } | null>(null);
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
        const { until } = result;
        if (page === 0) {
          firstPage.current = {
            ids: new Set(result.concerts.map((c) => c.id)),
            hasMore: result.hasMore,
            until,
          };
        }
        setLoadedUntil(until);
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

  const refreshConcerts = useCallback(async () => {
    // Una página que estuviera llegando ya no vale
    generation.current += 1;
    const requestedIn = generation.current;
    requesting.current = true;
    try {
      const result = await fetchConcerts({ page: 0 });
      if (requestedIn !== generation.current) return;
      const { until } = result;
      firstPage.current = {
        ids: new Set(result.concerts.map((c) => c.id)),
        hasMore: result.hasMore,
        until,
      };
      setRaw(result.concerts);
      setNextPage(1);
      setHasMore(result.hasMore);
      setLoadedUntil(until);
      setError(null);
    } catch (e) {
      console.warn('[refresh] No se han podido recargar los conciertos:', e);
    } finally {
      if (requestedIn === generation.current) requesting.current = false;
    }
  }, []);

  const concerts = useMemo(() => mergeConcerts(raw), [raw]);

  useEffect(() => saveJSON(STORAGE_KEYS.plans, myEvents), [myEvents]);
  useEffect(() => saveJSON(STORAGE_KEYS.wishlist, wishes), [wishes]);
  useEffect(() => saveJSON(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => saveJSON(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveJSON(STORAGE_KEYS.onboarding, { welcomeSeen }), [welcomeSeen]);
  useEffect(() => saveJSON(STORAGE_KEYS.discover, discover), [discover]);

  const value = useMemo<AppState>(() => {
    const goingCount = (c: Concert) => c.going + (myEvents[c.id] ? 1 : 0);
    const unreadCount = (id: string) => unread[id] ?? 0;
    // Datos frescos de la API si el concierto sigue en ella; si no, la copia
    const fresh = (saved: Concert) => concerts.find((c) => c.id === saved.id) ?? saved;
    const plans = Object.values(myEvents).map(fresh);
    const wishlist = Object.values(wishes)
      .map(fresh)
      .sort((a, b) => (a.startsAt ?? Infinity) - (b.startsAt ?? Infinity));
    const myConcerts = splitPlans(plans).upcoming;
    const weights = tasteWeights({
      picks: profile.tasteArtists,
      plans,
      wishlist,
      swipes: discover.swipes,
    });

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
      refreshConcerts,
      isGoing: (id) => id in myEvents,
      toggleGoing: (concert) => {
        const joining = !(concert.id in myEvents);
        setMyEvents(({ [concert.id]: existing, ...rest }) =>
          existing ? rest : { ...rest, [concert.id]: concert }
        );
        setCelebration(joining ? { id: concert.id, at: Date.now() } : null);
      },
      celebration,
      endCelebration: () => setCelebration(null),
      goingCount,
      plans,
      myConcerts,
      wishlist,
      isWished: (id) => id in wishes,
      toggleWish: (concert) =>
        setWishes(({ [concert.id]: existing, ...rest }) =>
          existing ? rest : { ...rest, [concert.id]: concert }
        ),

      profile,
      updateProfile: (changes) => setProfile((current) => ({ ...current, ...changes })),

      settings,
      updateSettings: (changes) => setSettings((current) => ({ ...current, ...changes })),
      clearUserData: () => {
        setMyEvents({});
        setWishes({});
        setProfile(EMPTY_PROFILE);
        setSettings(DEFAULT_SETTINGS);
        setMessages({});
        setFilters(DEFAULT_FILTERS);
        setWelcomeSeen(false);
        setDiscover({ swipes: {}, deckIntroSeen: false });
      },

      welcomeSeen,
      finishWelcome: () => setWelcomeSeen(true),

      swipes: discover.swipes,
      swipe: (concert, liked) =>
        setDiscover((d) => ({
          ...d,
          swipes: { ...d.swipes, [concert.id]: { liked, genre: concert.genre } },
        })),
      deckIntroSeen: discover.deckIntroSeen,
      finishDeckIntro: () => setDiscover((d) => ({ ...d, deckIntroSeen: true })),
      tasteWeights: weights,
      myTastes: profile.tasteArtists.length > 0 ? topTastes(weights) : profile.tastes,

      filters,
      setFilters,
      resetFilters: () => setFilters(DEFAULT_FILTERS),
      // Solo hasta donde está todo cargado: así la lista crece por el final, sin saltos
      visibleConcerts: applyFilters(
        loadedUntil == null
          ? concerts
          : concerts.filter((c) => c.startsAt != null && c.startsAt <= loadedUntil),
        filters,
        goingCount
      ),
      genres: genresOf(concerts),

      messagesFor: (room) => messages[room] ?? [],
      sendMessage: (room, text) => {
        const message = { id: `${Date.now()}`, text, sentAt: Date.now() };
        setMessages((current) => ({ ...current, [room]: [...(current[room] ?? []), message] }));
      },
      sendMedia: (room, media) => {
        const message = { id: `${Date.now()}`, text: '', ...media, sentAt: Date.now() };
        setMessages((current) => ({ ...current, [room]: [...(current[room] ?? []), message] }));
      },
      messagesOfConcert: (concertId) =>
        Object.entries(messages)
          .filter(([room]) => room.startsWith(`${concertId}:`))
          .flatMap(([, list]) => list)
          .sort((a, b) => a.sentAt - b.sentAt),

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
    refreshConcerts,
    myEvents,
    wishes,
    profile,
    settings,
    welcomeSeen,
    discover,
    celebration,
    filters,
    unread,
    messages,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
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
