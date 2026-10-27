> **DayStage Calendar.** Este repo es DayStage Calendar (calendario de turnos con conciertos), nacido de meeet el 2026-10-27. El plan está en https://claude.ai/artifact/71ygyNNPbihGnzva6Ro1zR. Mientras no se diga lo contrario, la marca visual y los textos de la interfaz siguen siendo los de meeet.

@AGENTS.md

# MEEET

App móvil (Expo SDK 58, React Native 0.88, React 19.3, TypeScript estricto) para descubrir conciertos y decir **"Voy"**. Beta, solo Barcelona. Los conciertos vienen de la Ticketmaster Discovery API y de la Agenda Cultural del Ajuntament de Barcelona (Open Data BCN). Plataforma principal: iOS/Android. Web existe por la plantilla, pero no es prioritaria.

Gestor de paquetes: **npm** (`package-lock.json`). Instala dependencias con `npx expo install`, nunca con `npm install <pkg>`.

```bash
npm run check        # typecheck + lint + tests: pásalo antes de dar algo por terminado
npm test             # solo tests (jest-expo); npm run test:watch para modo watch
```

- Tests: `*.test.ts` junto al módulo que prueban. Los datos de prueba van en `src/data/__fixtures__/` (`makeConcert`, `fromSource`). La lógica de `src/data/` debe tener tests; las pantallas, de momento, no.
- Importa `describe`/`it`/`expect`/`jest` desde `@jest/globals`. Con TypeScript 6, los tipos globales de `@types/jest` no se cargan solos.
- El estado de trabajo vive en `.ai/STATE.md`. Este archivo es solo para reglas permanentes.

## Estructura

```
src/
  app/                      # Rutas (Expo Router)
    _layout.tsx             # Layout raíz: ThemeProvider + AppProvider + Stack (tabs, concert, filters)
    (tabs)/
      _layout.tsx           # Renderiza <AppTabs />
      index.tsx             # Calendario (primera pestaña; la app se abre aquí; antes «Turnos»): vista de mes (lunes primero, flechas, abreviatura y color de cada turno, hoy marcado, punto en los días cambiados, foto de tus planes «Meeet In!» que abre la ficha), leyenda, «Tus planes este mes», rotación y tipos
      eventos.tsx           # Eventos (segunda pestaña; antes «Inicio», `/eventos`): cabecera fija (logo y lema que se encogen, chips Todos · Filtros · Hoy · Mañana · Próxima semana · Calendario siempre visibles) y lista filtrada que carga más al bajar
      descubrir.tsx         # Descubrir: "Tinder" de conciertos. Pide perfil; la primera vez explica, eliges 5 artistas (TastePicker) y explica las cartas
      meeet-in.tsx          # Meeet in: próximos planes arriba y "Conciertos pasados" plegables abajo, cada uno con su chat y su burbuja de no leídos
      perfil.tsx            # Perfil estilo Instagram: nick, foto cuadrada con esquinas redondeadas (104 pt) y a su lado, con el mismo alto, la pastilla del próximo concierto (abre su ficha) sobre meeet in / seguidores / seguidos (se tocan: columna Meeet in y `/follows`); nombre, estilos, ubicación, bio, canción, redes, fondo en todo el perfil y cuadrícula en tres columnas: Meeet in (próximos), Lista de deseos y Pasados: un paginador horizontal (las columnas se arrastran con el dedo y la raya de las pestañas las sigue; la página mide lo que la columna que se ve)
    concert/[id].tsx        # Detalle (fuera de las pestañas): hero, "Meeet In!", "Comprar entradas" / "Entrada gratuita", compartir, "Ir a la sala de chat" (solo si vas), fragmento de la canción más popular del artista, pestañas Información/Lugar con icono y texto debajo, como las columnas del perfil
    chat/[id]/index.tsx     # Sala de chat de un concierto, estilo Telegram/WhatsApp (solo desde Meeet in): una sola sala; cabecera con la foto del evento y miembros, mensajes por día, fotos y vídeos (clip = galería, cámara), hora y doble check
    chat/[id]/info.tsx      # Información de la sala: Gente · Fotos · Vídeos · Setlist (setlist.fm)
    welcome.tsx             # Bienvenida: imagotipo animado y logo; diapositivas (conciertos, Meeet In!, chat, Descubrir, perfil); al final, crear perfil o "Ahora no"
    onboarding.tsx          # Creación de perfil paso a paso: nick → nombre → foto → gustos → idioma → ¡Listo!
    follows.tsx             # Seguidores · Seguidos (desde sus números en Perfil): con cuenta, listas reales, buscador por nick y Seguir/Siguiendo; sin ella, explicado
    settings.tsx            # Ajustes (Perfil › engranaje): idioma principal, privacidad, notificaciones, turnos (margen tras el turno), vibración, caché, borrar datos, información
    filters.tsx             # Hoja nativa (formSheet): ordenar, género, precio
    buscar.tsx              # Buscar (lupa de la cabecera de Inicio; ya no es pestaña): conciertos cargados + búsqueda en las ticketeras
    event-form.tsx          # Modal "Añadir concierto" / "Editar concierto" (desde Buscar o la ficha): público o privado, artista, fecha, horas, sala, dirección, ciudad, estilo, precio, enlace, foto y descripción
    calendar.tsx            # Hoja del calendario: intervalo de días, con punto en los días con conciertos; al bajar por los meses pide más páginas y "Quitar fechas" vacía la caché (`trimConcerts`)
    edit-profile.tsx        # Modal de editar perfil: foto, nick (@, reglas tipo Instagram), nombre, pronombres, bio, ubicación (texto libre), canción y redes (Instagram, TikTok, X, Apple Music, Spotify); solo se aplica al pulsar "Guardar"
    sign-in.tsx             # Modal "Tu cuenta": email → enlace que vuelve a la app (o código si la plantilla lo trae; 8 cifras en el proyecto)
    auth-callback.tsx       # Vuelta del enlace del email (daystage://auth-callback?code=…): canjea la sesión (PKCE)
    shift-day.tsx           # Hoja (formSheet) de un día de Turnos: «Vas a» (tus planes, a la ficha), elegir otro turno o libre o "Volver a la rotación", y más conciertos de ese día
    shift-types.tsx         # Tipos de turno: lista y "Añadir tipo de turno"
    shift-type.tsx          # Modal para crear o editar un tipo: nombre, abreviatura, horas (HH:MM), descanso y color de SHIFT_COLORS
    shift-import.tsx        # Modal "Importar turnos" (Turnos › Tipos de turno › Importar): pegar, ver el resumen e importar
    rotation.tsx            # Asistente de rotación: nombre, fecha de inicio, secuencia tocando tipos/Libre, plantilla 2M-2T-2N-4L y vista previa de 14 días
  components/
    go-button.tsx           # Botón "Meeet In!" (antes "Voy"): confeti y háptica. Es el componente central de la marca
    profile-backdrop.tsx    # Fondo de Perfil a pantalla completa (también bajo la cuadrícula): el degradado elegido y tres manchas de sus colores que derivan (quieto con "Reducir movimiento")
    organic-backdrop.tsx    # Fondo de bienvenida y creación de perfil: imagotipo gigante que se mueve muy despacio
    create-profile-card.tsx # Tarjeta "Crea tu perfil" con sus ventajas (Perfil sin crear) y PROFILE_BENEFITS
    taste-picker.tsx        # Carruseles de artistas en círculo (Internacional, España, Catalunya); se eligen 5
    concert-deck.tsx        # Cartas deslizables (gesture-handler + Reanimated) hasta abajo: derecha = te gusta, izquierda = no, arriba = Meeet In!; al arrastrar, borde del color y una pastilla grande de cristal con un halo blanco detrás (Me gusta / No me interesa / Meeet In!); tocar abre la ficha; ✕ · Meeet In! · ♥ flotan sobre la foto, encima del texto (INFO_H)
    media-viewer.tsx        # Foto o vídeo a pantalla completa (ficha y chat): zoom, deslizar a un lado o abajo para cerrar, ✕ y guardar en Fotos
    video-thumb.tsx         # Primer fotograma de un vídeo con el botón de play (chat e información de la sala)
    concert-image.tsx       # Imagen de un concierto: su foto → la del artista (Apple Music) → la genérica de música. Úsala en vez de <Image> para conciertos
    music-placeholder.tsx   # Imagen genérica de música (degradado + notas) para conciertos sin foto
    wish-button.tsx         # Corazón de la lista de deseos (junto a "Meeet In!" en Inicio y en el detalle)
    meeet-in-burst.tsx      # Destellos al darle a "Meeet In!" (salen de la insignia de la foto)
    imagotipo.tsx           # Imagotipo de la marca (dos círculos), con Views. `ImagotipoAnimado`: los círculos se juntan en uno y se separan, en bucle (insignia "Meeet In!")
    chip.tsx                # Chip en píldora (filtros, opciones)
    search-bar.tsx          # Buscador en píldora (Inicio)
    event-image.tsx         # Foto 16:9 del concierto, igual en Inicio y en el detalle (sin la fuente): insignia "Meeet In!" con el imagotipo animado abajo a la izquierda
    holo-frame.tsx          # Pie de foto con degradado animado (56 pt, bajo la insignia "Voy") dentro de la foto; solo si vas
    profile-avatar.tsx      # Avatar: foto opcional con icono de reserva; en círculo, o cuadrado redondeado con `rounded` (Perfil y Editar perfil)
    social-icon.tsx         # Icono de cada red social (Ionicons; Spotify, de FontAwesome porque Ionicons no lo tiene)
    tab-avatar.tsx          # Genera la miniatura circular de tu foto para la pestaña Perfil
    song-row.tsx            # Fila de canción: carátula, título, artista y play del fragmento
    song-picker.tsx         # Hoja para buscar en Apple Music y elegir la canción del perfil
    profile-song.tsx        # Tarjeta de la canción en Perfil, con el enlace a Apple Music
    screen-title.tsx        # Título grande con el punto violeta, y ScreenSubtitle
    screen-header.tsx       # Cabecera fija de cristal de las pestañas (título y, si hace falta, buscador): la lista pasa por debajo
    app-tabs.tsx            # NativeTabs (iOS/Android): Calendario · Eventos · Descubrir · Meeet in · Perfil, con el badge de no leídos
    app-tabs.web.tsx        # Barra de pestañas para web (expo-router/ui), con un punto rojo como badge
    splash-overlay*.tsx     # Relevo del splash nativo con fundido (en web no hace nada)
    shift-badge.tsx         # Abreviatura de un turno sobre su color (libre: "L" gris)
    availability-pill.tsx   # Pastilla «Día libre» / «Tras tu turno» / «Antes de tu turno» / «Trabajas» (nada sin turnos)
    your-day-card.tsx       # «Tu día» en la ficha: turno de ese día y disponibilidad; sin turnos, enlace a Turnos
    person-row.tsx          # Una persona: foto, nombre, @nick y «Seguir» / «Siguiendo» (y un accesorio, p. ej. denunciar o bloquear)
    export-buttons.tsx      # Turnos: «Al calendario» y «PDF del mes»
    reminder-scheduler.tsx  # Sin interfaz: reprograma los avisos al cambiar turnos, planes o ajustes (en el layout raíz)
    month-report-card.tsx   # Informe del mes en Turnos: cifras, reparto de turnos y barras por semana
    friends-card.tsx        # «Tus amigos» en la ficha: quién de la gente que sigues va y qué amigos están libres ese día
    nav-header.tsx          # Cabecera de las pantallas de Turnos que se abren encima (flecha o "Cancelar", título, botón a la derecha)
  data/
    concerts.ts             # Tipos `Concert` / `TicketOffer` + fetchConcerts({ page, keyword }): una página de todas las fuentes en paralelo (si falla una, sigue con las demás). La fusión se hace en app-context con todas las páginas juntas
    sources/                # Una ticketera por archivo (`EventProvider`)
      index.ts              # PROVIDERS: fuentes activas en orden de prioridad + cómo añadir una nueva
      types.ts              # TicketSource, EventProvider (la interfaz no muestra el nombre de las fuentes)
      ticketmaster.ts       # Discovery API → Concert
      user.ts               # Eventos propios (user_events en Supabase): públicos y privados a los que tienes acceso; todos en la primera página
      bcn.ts                # Agenda BCN: lee el archivo diario de GitHub Pages (o el del Mac con EXPO_PUBLIC_BCN_AGENDA_URL=local); guarda el último para cuando no hay red (`meeet.bcn-feed.v1`) y quita los días ya pasados (`upcomingConcerts`)
    bcn-agenda.ts           # Agenda Cultural de Barcelona → conciertos (filtro, hora y precio del horario, nombres). Lo usan la app y el script
    merge.ts                # Deduplica entre fuentes (mismo día + sala + artista) y junta las ofertas. `canonicalConcertId`: id del concierto y de su sala en el servidor
    format.ts               # formatDate / toTimestamp / formatPriceRange, comunes a todas las fuentes
    text.ts                 # foldText / compactText / headlinerName: comparaciones sin acentos ni signos, y artista principal de un evento
    songs.ts                # Búsqueda de canciones en Apple Music (API de iTunes) → ProfileSong
    musicbrainz.ts          # Info de artistas (tipo, país, géneros, enlaces). pickArtist solo acepta coincidencias seguras
  hooks/use-chat-room.ts    # La sala de un concierto: remota (con cuenta), local (sin backend) o pide cuenta ('signin')
  hooks/use-artist-info.ts  # Carga la info de MusicBrainz para el detalle (Info › "Sobre el artista", artist-card.tsx)
  hooks/use-song-preview.ts # Reproductor de fragmentos (expo-audio): play/pausa y parar
  hooks/use-artist-artwork.ts # Imagen del artista para conciertos sin foto: en cola (una cada 3 s, Apple limita ~20/min) y guardada en el móvil (`meeet.artwork.v1`)
  hooks/use-faded-preview.ts  # Fragmento de la carta de Descubrir con fundido de entrada (1,2 s)
  hooks/use-concert-search.ts # Búsqueda: al momento en lo cargado y, tras 350 ms, en las ticketeras (`keyword`)
    event-info.ts           # Limpia los textos de Ticketmaster: reseña (`description`, o `info` sin la logística) + puertas, telonero y edad. Descarta los eventos "Test ..."
    filters.ts              # Tipos y opciones de filtros + applyFilters() (funciones puras)
    app-context.tsx         # AppProvider / useApp() (lo pesado —filtrar, gustos, planes— va en `useMemo` aparte, por sus datos): conciertos, "Voy" (guarda copia del concierto), plans, myConcerts, profile, filtros, no leídos
    plans.ts                # isPast / splitPlans / companionsLabel: próximos frente a ya pasados ("X personas van contigo")
    taste.ts                # Gustos: catálogo de 36 artistas, estilos (tasteGenre), pesos (tasteWeights) y orden de las cartas (buildDeck)
    chat.ts                 # Salas: ChatMessage (texto, foto o vídeo), chatKey, separadores por día, "N miembros"
    setlists.ts             # Setlists anteriores del artista (setlist.fm; clave EXPO_PUBLIC_SETLISTFM_KEY)
    settings.ts             # Ajustes (tipo, valores por defecto, withDefaults)
    profile.ts              # Tipo Profile, límites y reglas del nick (normalizeNick, nickError)
    save-media.ts           # Guarda una foto o vídeo en la galería (expo-media-library); las remotas se bajan antes
    profile-photo.ts        # Elegir foto (expo-image-picker, recorte cuadrado) y guardarla en documentos (expo-file-system)
    storage.ts              # Persistencia local (expo-sqlite/kv-store): planes y perfil, claves versionadas (`meeet.plans.v1`…)
    shifts.ts               # Turnos (funciones puras): ShiftType, Rotation, DayOverride, ShiftPlan; shiftForDate, shiftInterval, freeWindows, availabilityFor ('libre' | 'tras-turno' | 'antes-turno' | 'trabajas'), monthGrid, shiftHours; fechas 'YYYY-MM-DD'
    shift-import.ts         # Importar turnos pegados ("AAMMDD=HH:MM-HH:MM" / "AAMMDD=V"): un tipo por horario (mañana verde si acaba ≤ 19:00, tarde roja; Vacaciones ámbar, día libre) y un cambio por día
    shift-sync.ts           # Copia de los turnos en tu cuenta (user_shift_plans): syncDecision (gana el último cambio) y planFromJson (comprueba la copia); shift-sync-service.ts la sube y baja
    shift-db.ts             # Turnos en SQLite (`daystage.db`): tablas shift_types, rotations, rotation_days, day_overrides; migraciones con PRAGMA user_version
    shifts-context.tsx      # ShiftsProvider / useShifts(): el plan de turnos y sus cambios (aparte de app-context, y por fuera de AppProvider)
    supabase.ts             # Cliente de Supabase (null sin EXPO_PUBLIC_SUPABASE_URL/ANON_KEY: modo local). Sesión en expo-sqlite/kv-store
    session-context.tsx     # SessionProvider / useSession(): cuenta por email (enlace con PKCE, o código); Apple y Google, pendientes
    chat-service.ts         # Backend: asistencia (setAttendance, going_counts), perfil, mensajes paginados, Realtime, fotos/vídeos en Storage, no leídos (room_reads), bloquear y denunciar
    remote.ts               # Filas de Supabase ↔ tipos de la app (puras, con tests): messageFromRow, concertToRow, profileToRow, mediaUpload…
    user-events.ts          # Eventos propios (puras, con tests): borrador, validateDraft, draftToRow, rowToConcert (ids `user-<uuid>`), findDuplicate; user-events-service.ts los guarda, lee y borra
    social.ts               # Social (puras, con tests): PublicProfile, displayName, mutualIds, daysToShare (libre/trabaja, vacaciones = libre), friendsLabel, nickQuery
    social-service.ts       # Supabase: buscar por nick, seguir, seguidores/seguidos, shared_days, quién va y quién está libre, gente de una sala
    social-context.tsx      # SocialProvider / useSocial(): seguidos, seguidores, amigos (mutuos) y compartir tus días si lo activas (dentro de AppProvider)
    reports.ts              # Informes (puras, con tests): monthReport (horas, mañanas/tardes/noches, vacaciones, libres, extra sobre la jornada, ganancias con tarifa, horas por semana), shiftKind, formatHours, formatEuros
    reminders.ts            # Avisos (puras, con tests): planReminders → antes de cada turno (minutos de Ajustes) y el día antes de cada concierto con «Meeet In!» a las 20:00, diciendo si ese día trabajas; como mucho 60 (iOS guarda 64)
    notifications.ts        # expo-notifications: borra y vuelve a programar todos los avisos; sin su parte nativa (compilación antigua), no hace nada
    shift-export.ts         # Exportar (puras, con tests): calendarEvents (turnos con su hora real, vacaciones de día entero, marca [DayStage] en las notas) y monthHtml (PDF del mes con colores y resumen)
    shift-export-service.ts # Calendario «DayStage» del iPhone (expo-calendar; no en Expo Go) sin duplicados y PDF del mes (expo-print + expo-sharing)
    event-from-url.ts       # Rellenar un evento desde su web (puras, con tests): JSON-LD schema.org Event (también en @graph), si no Open Graph/Twitter; ticketmasterLink
    event-from-url-service.ts # Descarga la web (10 s, 2 MB, User-Agent de navegador) o, si es de Ticketmaster, busca el evento en su API; si ya está cargado, lo abre
    concert-shifts.ts       # Conciertos × turnos: concertAvailability (con el margen de Ajustes), canGo, hasSchedule, concertsByDate, AVAILABILITY_LABELS; las 00:00 = sin hora (se supone las 21:00)
  theme.ts                  # ✅ Paleta de MEEET (COLORS). Úsala siempre
  constants/theme.ts        # Medidas de layout: BottomTabInset, MaxContentWidth
assets/images/              # Iconos y splash de MEEET (provisionales: monograma "m." y marca "meeet.")
scripts/generate-brand-assets.swift   # Regenera los PNG de assets/images: `swift scripts/generate-brand-assets.swift`
scripts/build-bcn-agenda.mjs          # Genera feed/bcn-concerts.json desde Open Data BCN (`npm run feed:build`)
scripts/publish-bcn-agenda.sh         # Lo genera y lo sube a la rama gh-pages (`npm run feed:publish`); a diario desde este Mac con scripts/com.meeet.bcn-agenda.plist
scripts/serve-feed.mjs                # Sirve ese archivo en la red local para probar en desarrollo (`npm run feed:serve`)
scripts/generate-tab-icons.swift      # Iconos propios de la barra (casa sin puerta, calendario de Turnos, imagotipo de dos círculos) en assets/images/tabs
scripts/jest-timezone.js              # globalSetup de jest: los tests corren siempre en Europe/Madrid
```

- **Turnos** (`shifts.ts`): las fechas son días locales en texto `'YYYY-MM-DD'`; los días se suman en UTC (sin cambios de hora) y las horas reales se calculan con la hora local, así que la noche del último domingo de octubre dura 9 h y la de marzo, 7 h. Un turno cuyo fin es igual o anterior al inicio acaba al día siguiente. Antes de `startDate` la rotación sigue hacia atrás (módulo positivo). Un cambio del día (`DayOverride`, `shiftTypeId: null` = libre) manda sobre la rotación; elegir en la hoja lo mismo que dice la rotación borra el cambio. `availabilityFor` (`'libre' | 'tras-turno' | 'antes-turno' | 'trabajas'`) da por hecho que un concierto dura 3 h y deja 60 min tras el turno (los dos se pueden cambiar). Los colores de turno se guardan como clave de `SHIFT_COLORS` (`theme.ts`), nunca como hex. Solo hay una rotación.
- **Backend (Supabase, Fase 3)**: proyecto `fafutqrkpnasiccrebpo`. Esquema y RLS en `supabase/migrations` (profiles, concerts, rooms, attendance, messages, room_reads, blocks, reports, follows; bucket privado `chat-media` con rutas `<sala>/<usuario>/<archivo>`; Realtime en messages; trigger que crea el perfil al registrarse). En la app solo van `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publicable) en `.env.local`; **nunca** la service_role ni la contraseña de la base. Sin esas claves, `supabase` es null y todo funciona en local como antes. Con backend: el id del concierto en el servidor (y de su sala) es `canonicalConcertId` (día + sala + artista normalizados); solo entran en una sala (leer, escribir, ver fotos) quienes van (`is_room_member`); "Meeet In!" escribe en `attendance` y el recuento de quién va sale de `going_counts` (también sin cuenta); al entrar con tu cuenta se suben tus planes próximos y tu perfil (sin la foto, pendiente). No leídos con `room_reads` + `unread_counts`, cada 60 s y al entrar en una sala. Mantener pulsado un mensaje de otra persona: denunciar o bloquear (RLS oculta los mensajes de quien bloqueas). Entrar: el plan gratuito de Supabase no deja cambiar las plantillas de email con su correo por defecto, que solo trae un enlace. La app pide el email con `emailRedirectTo: daystage://auth-callback` y `flowType: 'pkce'`; el enlace vuelve a `auth-callback`, que canjea el código. Esa dirección debe estar en las URL de redirección permitidas del proyecto (`additional_redirect_urls = ["daystage://**"]` en config.toml). El correo gratuito de Supabase manda muy pocos emails por hora: para probar hay acceso anónimo (`enable_anonymous_sign_ins`, botón «Probar sin email (desarrollo)» solo con `__DEV__`), que hay que desactivar antes de publicar. Errores de cuenta en español con `authErrorMessage` (`auth-errors.ts`). Con correo propio (SMTP), las plantillas con el código están en `supabase/templates`. `config.toml` está igualado con el proyecto remoto para que `supabase config push` solo cambie lo que se toque. Migraciones: `npx supabase db push` (requiere `supabase login` y `link`). En local (Docker): `npx supabase start` y `npm run backend:e2e` (`scripts/backend-e2e.mjs`: 25 comprobaciones de registro con enlace y PKCE, asistencia, chat, Storage, Realtime, no leídos, bloqueos y RLS; nunca contra el remoto). Realtime tarda unos segundos en estar listo tras suscribirse: al quedar suscrita, la sala vuelve a pedir la última página.
- **Exportar turnos** (Turnos, bajo el informe): «Al calendario» copia de la semana pasada a 3 meses vista al calendario «DayStage» (lo crea si no existe); para no duplicar, borra antes los eventos con `[DayStage]` en las notas de ese intervalo. Necesita la app compilada: en Expo Go lo explica. «PDF del mes» genera el mes que se ve con el informe y abre la hoja de compartir.
- **Avisos locales** (`expo-notifications`, plugin con `enableRemoteNotifications: false`; funcionan en Expo Go): «Aviso antes de tu turno» (No, 30 min, 1 h, 2 h; `settings.shiftReminderMinutes`) y «Recordatorio el día antes» de los conciertos (`settings.notifications.reminders`). Se piden permisos la primera vez que hay algo que avisar. Las compilaciones de desarrollo hechas antes de añadir el módulo no tienen su parte nativa: hay que recompilar (`npx expo prebuild --platform ios --clean` + `npx expo run:ios`).
- **Informes** (Turnos, bajo el mes): `monthReport` con la jornada (`settings.workdayHours`, 8 h) y la tarifa opcional (`settings.hourlyRate`, Ajustes › Turnos). Las horas son las del horario menos el descanso (`shiftHours`, sin cambios de hora); las vacaciones no cuentan como trabajo; extra = lo que pasa de la jornada cada día.
- **Social**: seguir es asimétrico (como Instagram); amigos = os seguís los dos (`are_mutual`). Compartir tus días es opcional (Ajustes › Turnos › «Compartir mis días libres», `settings.shareDays`): se suben los próximos 60 días como libre o trabaja a `shared_days` (nunca el horario) y se borran al desactivarlo; RLS: solo los ven tus amigos. En la ficha, `FriendsCard`: quién de la gente que sigues va (attendance) y qué amigos están libres ese día. En la sala, «Gente» es la lista real de quien va, con denunciar o bloquear. Las fotos de perfil aún no se suben (se ve el icono).
- **Rellenar desde la web**: en «Añadir concierto», «¿Tienes la web del concierto?» + «Rellenar». Muchas webs de salas y ticketeras (Auditori, Fever, Paral·lel 62, Orfeó…) no publican el Event en JSON-LD: solo dan título, foto y descripción, y la fecha y la sala hay que ponerlas a mano (el formulario marca lo que falta). Ticketmaster bloquea su web, pero se encuentra en su API (el id de la web no es el de la API: se busca por las palabras del enlace). Mejora futura: un modelo de IA en una Edge Function (con la clave en el servidor) para las webs sin datos estructurados.
- **Eventos propios**: si un concierto no sale en Buscar, «¿No lo encuentras? Añádelo» (siempre al final de la lista) abre `/event-form`. Público (lo ve cualquiera con sesión) o privado (solo quien lo crea y quien abre su enlace: `join_private_event` convierte el enlace en invitación). Antes de guardar uno público se avisa si parece un duplicado (`findDuplicate`, la misma lógica que `merge.ts`). Quien lo crea queda en «Meeet In!». La fuente `user` va la última en `PROVIDERS` (si coincide con otra fuente, mandan los datos de esa) y la interfaz no la nombra; candado «Privado» en la tarjeta y la ficha; el creador puede editar y borrar desde la ficha. Fotos en el bucket público `event-images` (`<usuario>/<archivo>`). Una ficha `user-…` que no está cargada se pide al servidor (enlace compartido). Pendiente: invitar a amigos (cuando haya social) y coordenadas para el mapa.
- **Tus planes en el calendario**: los conciertos con «Meeet In!» (`plans`, también los pasados) se ven en el mes de Turnos como la foto del concierto con el aro del acento, bajo el turno; tocarla abre la ficha (con varios planes ese día, la hoja del día). `plansInMonth` da la lista «Tus planes este mes». El punto negro (conciertos que te encajan) no cuenta los planes.
- **Conciertos × turnos** (Fase 2): `useApp().availability(concierto)` da `'libre' | 'tras-turno' | 'antes-turno' | 'trabajas'` o null (sin hora o sin turnos: entonces no se pinta nada y el chip «Mis días libres» no sale). `'antes-turno'` = ese día trabajas más tarde pero el concierto acaba antes (se añadió a los tres pedidos porque un concierto a las 11:00 antes de una noche salía como «Día libre»). Las fuentes ponen las 00:00 a los conciertos sin hora: `effectiveStart` supone las 21:00 de ese día. El margen tras el turno está en Ajustes › Turnos (`settings.shiftMarginMinutes`, 60 por defecto). Se usa en: pastilla de cada tarjeta de Inicio, chip «Mis días libres» (`Filters.freeDaysOnly`, se puede ir), «Tu día» en la ficha, punto bajo los días del mes de Turnos con conciertos a los que puedes ir (y su lista en la hoja del día) y peso extra en Descubrir (`AVAILABILITY_BONUS`: libre +2, antes/tras +1).
- **Tipos de día libre** (`ShiftType.off`, migración 2 de `shift-db`): vacaciones y similares se ven en el calendario con su color y abreviatura, pero cuentan como libre (`workTypeForDate`) para conciertos, huecos y días compartidos. En el mes, los turnos de trabajo muestran la hora de entrada y, debajo, la de salida (`shortTime`). Colores `verde` (mañanas) y `rojo` (tardes) en `SHIFT_COLORS`.
- **Copia de los turnos en la cuenta**: con sesión, `ShiftsProvider` sube el plan entero a `user_shift_plans` (1,5 s después de cada cambio) y al entrar decide con `syncDecision` si subir o bajar; la hora del último cambio local va en `daystage.shifts-updated.v1`. Nunca subas turnos reales de nadie al repo (es público): en los tests, datos inventados.
- **Base de datos de turnos** (`shift-db.ts`): síncrona, se lee entera al arrancar y cada cambio se escribe al momento. Para cambiar el esquema, añade una función al final de `MIGRATIONS` (nunca edites una publicada). Los tres tipos por defecto (Mañana 06–14, Tarde 14–22, Noche 22–06) solo se crean en la migración 1.
- Barra de pestañas: Calendario · Eventos · Descubrir · Meeet in · Perfil. La app se abre en Calendario (`(tabs)/index.tsx`, `/`); la lista de conciertos (antes Inicio) es `(tabs)/eventos.tsx` (`/eventos`). En el código y en estas notas, «Inicio» sigue llamándose así a la pantalla de Eventos. En iPhone caben 5 (con más, iOS mete las últimas en "More"), así que Buscar no es pestaña: se abre con la lupa de la cabecera de Inicio (`/buscar`). No añadas otra pestaña sin quitar una.
- Alias de importación: `@/*` → `src/*` y `@/assets/*` → `assets/*`.
- `typedRoutes` y `reactCompiler` están activados en `app.json`. Navega con rutas tipadas: `router.push({ pathname: '/concert/[id]', params: { id } })`.
- Variable de entorno: `EXPO_PUBLIC_TICKETMASTER_KEY` en `.env.local` (no está versionado). Al llevar el prefijo `EXPO_PUBLIC_`, la clave se incrusta en el bundle. No metas ahí secretos de verdad.
- Los filtros y los mensajes del chat viven solo en memoria y se pierden al reiniciar la app; los planes (`myEvents`), deseos, perfil y ajustes se guardan en el móvil. `going` siempre llega a 0 desde la API: todavía no hay backend de asistentes.
- Los no leídos (`unreadByRoom` en `app-context.tsx`) vienen del servidor si hay cuenta; sin ella, siempre 0. El badge de la pestaña Meeet in y la burbuja de cada fila salen solos.
- El badge de una pestaña nativa se pinta solo si `NativeTabs.Trigger.Badge` está en el árbol. En iOS, `hidden` deja un "0" y un badge vacío se ve como un punto: renderízalo de forma condicional.
- Un concierto pasa a "ya fui" cuando termina su día (`isPast`). La API solo trae conciertos futuros, así que los pasados existen únicamente como la copia guardada al decir "Voy": el detalle los busca también en `plans`.
- "Todos" (primer chip de Inicio) quita filtros y fechas (`resetFilters`); si las fechas eran del calendario, vacía también lo cargado para ellas (`trimConcerts`), como "Quitar fechas". Está activo cuando no hay nada filtrado.
- Atajos de fecha en Inicio (`QUICK_DATES`, `quickRange`): Hoy, Mañana y Próxima semana (de lunes a domingo de la semana que viene) ponen `Filters.dates`; Calendario se marca cuando hay fechas que no son un atajo. El calendario es para turistas: vienen unos días y quieren conocer gente. `Filters.dates` es un intervalo de días incluidos (`DateRange`, medianoches locales); al quitarlas se descartan las páginas cargadas para el calendario (se queda la primera) y la caché de fotos en memoria.
- **Agenda BCN** (fuente `bcn`): ~830 conciertos de un día, desde el Palau de la Música hasta centros cívicos, muchos gratis. El original (~170 MB, toda la agenda cultural) no se baja en el móvil: `scripts/build-bcn-agenda.mjs` lo filtra (~650 KB) y `publish-bcn-agenda.sh` lo sube cada mañana a la rama `gh-pages`, que sirve GitHub Pages. Se publica desde el Mac (launchd) y no desde GitHub Actions porque Open Data BCN responde 403 a los servidores de GitHub (probado con User-Agent propio y reintentos). Licencia CC BY 4.0: hay que citar «Ajuntament de Barcelona» (está en Ajustes › Información, el único sitio donde se nombran las fuentes). Es concierto si tiene la tipología "Concerts" y ninguna de fiesta, feria o taller (`NOT_A_CONCERT`). La hora no viene en la fecha (trae 03:00 o 12:00 de relleno): sale del horario HTML (`parseTimetable`). No vende: el botón lleva a la web de entradas de la sala, o dice "Entrada gratuita".
- Cada fuente tiene 15 s para responder (`withTimeout` en `concerts.ts`): una red que bloquea una fuente no la hace fallar, la deja colgada, y sin límite la lista no salía nunca.
- Fuentes que llegan enteras (bcn) y por páginas (Ticketmaster) a la vez: `fetchConcerts` devuelve `until`, la fecha hasta la que está todo cargado, y la lista de Inicio (`visibleConcerts`) solo muestra hasta ahí. Así crece por el final al bajar y no aparecen conciertos más arriba de lo ya visto. `concerts` lo tiene todo (para abrir y buscar).
- Conciertos por páginas de 20 (`PAGE_SIZE` en `ticketmaster.ts`), por fecha: Inicio pide la siguiente con `loadMore` al acercarse al final (`onEndReached`). Los filtros se aplican sobre lo cargado; si dejan la lista corta, FlatList sigue pidiendo páginas solo. Barcelona tiene ~130 conciertos de música en Ticketmaster (con el área metropolitana solo salen 3 más).
- Buscar no se queda en lo cargado: también pregunta a las ticketeras (`keyword`) y suma lo que encuentra al estado (`addConcerts`) para que el detalle pueda abrirlo.
- Fotos con `expo-image` (caché en memoria y disco), salvo en `tab-avatar.tsx`, que necesita la `Image` de React Native para capturarla.
- El chat de un concierto (`/chat/[id]`) se abre desde la pestaña Meeet in y, si vas ("Meeet In!" activado), desde el botón "Ir a la sala de chat" del detalle. Solo lleva el evento y su fecha (el avatar es la foto del evento, sin compra). Tocar la cabecera abre `/chat/[id]/info`. Los miembros reales llegarán con las cuentas: hoy solo estás tú y el número de quien va. Setlists de setlist.fm (gratis para uso no comercial, con clave en `.env.local`; sin ella, la pestaña lo explica). Una sola sala por concierto (`chatKey`, que reutiliza la clave de la antigua "General"). Fotos y vídeos se abren con `MediaViewer` y se guardan en Fotos con `saveToGallery` (`save-media.ts`, expo-media-library; baja antes las remotas). En Meeet in, los chats de conciertos pasados nunca se borran: van abajo, en "Conciertos pasados", plegables con una flecha; los próximos siempre arriba. Aún no hay servidor: los mensajes (`messagesFor`/`sendMessage`) viven en memoria y solo los ve quien los escribe; la pantalla lo avisa.
- El botón y la insignia de "vas a un concierto" dicen "Meeet In!" (internamente sigue siendo `isGoing`/`toggleGoing`). En frases normales ("¡Voy a …! ¿Te vienes?") se puede seguir usando "voy".
- Marco de "Voy": pie de foto de `FOOTER_HEIGHT` pt con el degradado de la marca girando, dentro de la foto y bajo la insignia "Voy" (si cambias su posición en `event-image.tsx`, ajusta el alto). Se probaron trazos finos arriba/abajo y en los 4 lados. Sin efecto holográfico (se probó tinte, reflejo y brillo y se descartó). Respeta "Reducir movimiento". Activo en Inicio y en el detalle.
- Datos del usuario (planes, perfil) se guardan en el móvil con `storage.ts`: se cargan de forma síncrona en el estado inicial y se guardan en un `useEffect`. Si cambias la forma de un dato guardado, sube la versión de su clave.
- Canción del perfil: se busca con la API de búsqueda de iTunes (`songs.ts`, gratis y sin clave) y se oye su fragmento de 30 s con `expo-audio` (`use-song-preview.ts`, un reproductor por pantalla). Condiciones de Apple: el fragmento solo en streaming, nunca descargado, y siempre con el enlace "Escuchar en Apple Music" al lado. La búsqueda solo se lanza mientras escribes en el selector (con espera de 350 ms). En Perfil, la música se para al cambiar de pestaña.
- Redes sociales del perfil (Instagram, TikTok, X, Apple Music, Spotify): se guarda solo el usuario (sin "@" ni URL; `normalizeHandle(texto, red)` saca el usuario del enlace pegado con el `link` de cada red) y el enlace se construye con `SOCIAL_NETWORKS` en `profile.ts`. Todas en minúsculas salvo Spotify (`caseSensitive`: su id distingue mayúsculas). Para añadir una red, añádela ahí, a `SOCIAL_ORDER` y a `EMPTY_PROFILE.socials` (`loadProfile` la rellena vacía en los perfiles guardados). Se abren con el enlace web (https), que salta a la app si está instalada.
- Foto de perfil: la URI del selector está en la caché y puede desaparecer. Solo se guarda en el perfil tras copiarla a `Paths.document` (`saveProfilePhoto`), con un nombre nuevo cada vez para que no se vea la foto vieja en caché. La foto anterior se borra.
- La pestaña Perfil muestra tu foto en círculo: NativeTabs no recorta, así que `tab-avatar.tsx` pinta el círculo oculto bajo las pestañas y lo captura en PNG (`react-native-view-shot`), normal y con un aro del acento del tema al seleccionarla. Se guarda en `profile.tabIcons` con la foto, el tamaño y el color del aro de los que sale, y se regenera si alguno no coincide (`currentTabIcons`): al cambiar de fondo, el aro cambia de color. Sin foto, icono del sistema. Requiere `renderingMode="original"` (si no, iOS lo tiñe) y pasar `scale` en la fuente (si no, sale a tamaño de píxel).
- Iconos de la barra en iOS: todos como imagen (PNG de `assets/images/tabs`), nunca SF Symbols mezclados: el símbolo coloca su etiqueta más baja que las imágenes. Calendario = calendario (`shifts`), Eventos = notas musicales (`events`), Inicio (sin usar) = casa sin puerta, Descubrir = las `sparkles` de Ionicons (las de "Recomendaciones para ti"), Meeet in = imagotipo de dos círculos, Perfil = tu foto o `person-circle`.
- Canción del artista en el detalle: `fetchTopSong` coge el primer resultado de iTunes del artista principal (iTunes ordena por relevancia, no da la popularidad). Si hay homónimos (varios `artistId` con ese nombre), `pickTopSong` devuelve null.
- Los nombres de pestaña y los títulos de pantalla van con mayúscula inicial, también "Meeet in" (Inicio · Descubrir · Meeet in · Perfil). El logo, en cambio, siempre en minúscula: `meeet.`.
- En Inicio, el logo y el lema van centrados (también el logo encogido). Ya no hay aviso de beta: no lo vuelvas a poner.
- Las demás pestañas (Turnos, Descubrir, Meeet in, Perfil) y Buscar llevan `ScreenHeader`: cabecera fija de cristal (blur + blanco al 45 %, como Inicio), puesta después de la lista, que recibe su alto como `paddingTop`. En Perfil ese margen va dentro del bloque del degradado, para que el fondo se vea a través del cristal. El subtítulo (`ScreenSubtitle`) va en la lista y se desplaza.
- Recargar Inicio: suena `assets/sounds/refresh.wav` (generado con `scripts/generate-sounds.py`; ajuste "Sonidos") y vibra; al terminar, el imagotipo crece y se desvanece mientras estallan los destellos (`SparkleBurst`), y el hueco se cierra con `LayoutAnimation`.
- Inicio y el imagotipo animado (`ImagotipoAnimado`): sale en la primera carga (en el centro) y al tirar hacia abajo para recargar. El "tirar para recargar" es propio (`onScrollEndDrag` + `refreshConcerts`), porque el RefreshControl de iOS solo admite su ruedecita: el imagotipo va detrás de la lista y asoma en el hueco. Tocar Inicio estando en Inicio sube arriba (`tabPress`).
- Al darle a "Meeet In!" (`toggleGoing`), `celebration` guarda ese concierto: su foto hace entrar la insignia con rebote, un reflejo y destellos (`MeeetInBurst`), y al acabar se limpia (`endCelebration`). Con "Reducir movimiento", sin destellos.
- Ajustes en `storage.ts` (`meeet.settings.v1`), cargados con `withDefaults` para que los campos nuevos tomen su valor inicial. Privacidad y notificaciones aún solo se guardan (no hay cuentas ni notificaciones): la pantalla lo dice. La vibración sí se aplica (`GoButton`).
- Bienvenida y perfil: `(tabs)/_layout.tsx` redirige a `/welcome` mientras `welcomeSeen` sea false (se guarda en `meeet.onboarding.v1`). Sin perfil (`profile.created`, que se pone al terminar `/onboarding`), Perfil muestra `CreateProfileCard`, y el chat y el corazón llevan a crearlo: son las ventajas que se prometen, así que deben cumplirse. Los perfiles de antes de `created` cuentan como creados si tenían nick, nombre o foto (`loadProfile`). Ajustes › "Borrar perfil y empezar de nuevo" lo borra todo y vuelve a la bienvenida.
- Descubrir y tus gustos: eliges 5 artistas de `TASTE_ARTISTS` (`profile.tasteArtists`). Las fotos son portadas de discos de Apple Music (no da fotos de artistas), guardadas fijas en el catálogo para no pedir 36 portadas cada vez. `tasteWeights` pondera estilos: artistas ×2, "Meeet In!" ×1, deseos ×0,5, cartas a la derecha +0,5 y a la izquierda −0,4 (sin bajar de 0), así que la app mejora sola. Las cartas (`buildDeck`) son conciertos futuros sin deslizar ni marcados, de más a menos afines. Derecha = a la lista de deseos; arriba o "Meeet In!" = vas (el botón también hace volar la carta hacia arriba); un toque abre la ficha (y se vuelve a la misma carta). Arriba a la izquierda, la canción que suena o "Sin música disponible". La carta que asoma detrás es siempre la que pasa delante: al deslizar cambian los gustos y la baraja se reordena, así que las dos siguientes se fijan (`keepAhead`, estado `ahead` en `descubrir.tsx`). Cada carta es la misma pieza de detrás a delante (misma `key`): al avanzar crece con una animación, sin volver a montarse; si se monta de nuevo, se ve un salto. Descubrir solo reserva la zona segura abajo: la pantalla ya acaba sobre la barra de pestañas (con `BottomTabInset` quedaba un hueco blanco). Deslizadas en `meeet.discover.v1`. Los géneros de Ticketmaster y de la agenda se traducen a MUSIC_TASTES con `tasteGenre`. Los conciertos no traen idioma: el idioma de tus artistas se muestra, pero aún no ordena las cartas.
- Fotos de artistas de la bienvenida (`assets/images/welcome`): de Wikimedia Commons, CC BY-SA, recortadas. La licencia obliga a citar a sus autores: el crédito está en la diapositiva 1 (`PHOTO_CREDITS`). Si cambias una foto, cambia también el crédito. No uses fotos sin licencia libre (por eso no está Alcalá Norte: en Commons solo hay su logo).
- "Meeet In!" y el corazón son para quien tiene perfil: sin él, llevan a `/onboarding`.
- Lista de deseos (`wishlist`, `toggleWish`): conciertos que te interesan aunque no vayas. Como los planes, guarda una copia del concierto (`meeet.wishlist.v1`) para que no desaparezca al pasar.
- Fondo del perfil (`profile.background`, `PROFILE_BACKGROUNDS` en `theme.ts`): pasteles en degradado suave, armónicos o complementarios. Se pinta detrás de todo el perfil con `ProfileBackdrop`, fijo mientras la lista pasa por encima y animado de forma sutil pero visible. Es público: lo verá quien entre en tu perfil cuando haya perfiles de otros.
- Todas las pestañas llevan `disableAutomaticContentInsets`: cada pantalla pone su margen superior, y si no, NativeTabs suma otra vez la zona segura (en Perfil se veía una franja blanca sobre el fondo). Si añades una pestaña, pónselo también.
- Iconos de la barra: siempre PNG de `generate-tab-icons.swift` (los de Ionicons se dibujan desde su fuente). `NativeTabs.Trigger.VectorIcon` se carga de forma asíncrona y, si el icono seleccionado llega antes que el normal, react-native-screens da un error de render.
- Los títulos de pestaña (`ScreenTitle`) ocupan la misma caja que el logo de Inicio encogido (`TITLE_SIZE`, `TITLE_LINE_HEIGHT`, `TITLE_TOP`), así que quedan a la misma altura. Inicio importa esas constantes: cámbialas solo ahí.
- Hojas `formSheet` en iOS: si el primer hijo nativo de la pantalla es (o contiene) un ScrollView, su contenido no se pinta. Pon delante otra vista; una vacía necesita `collapsable={false}`, porque si no React Native la elimina al aplanar. Tampoco uses `zIndex` en una capa superpuesta: también deja la lista en blanco. Para una cabecera fija de cristal sobre una lista, usa `stickyHeaderIndices={[0]}` (ver `calendar.tsx`).
- En pantallas cuyo margen superior pones tú (`ScreenTitle`, fotos a sangre), añade `contentInsetAdjustmentBehavior="never"` al ScrollView/FlatList: si no, iOS suma otra vez la zona segura (~59 pt) y el contenido baja.

## Identidad de marca

**Nombre:** se escribe siempre en minúsculas, con tres "e" y un punto violeta: `meeet.`. En el logo, la "m" y la "t" van en tinta y las "eee" en la escala del salmón, de clara a oscura (en Inicio, en la escala del color del perfil: `theme.logo`, que sin fondo es este mismo salmón y con fondo son dos mezclas de su acento con blanco y el acento; el punto de Inicio también va en el acento del tema):
```tsx
<Text style={{ color: COLORS.text, fontWeight: '700' }}>
  m<Text style={{ color: COLORS.peach }}>e</Text>
  <Text style={{ color: COLORS.peachMid }}>e</Text>
  <Text style={{ color: COLORS.peachDeep }}>e</Text>t
  <Text style={{ color: COLORS.accent }}>.</Text>
</Text>
```

**Imagotipo:** dos círculos que se encuentran: lavanda abajo a la izquierda, melocotón arriba a la derecha y el cruce en violeta (`<Imagotipo height={…} />`, `imagotipo.tsx`). Junto al logotipo (como en la hoja de marca) mide 1,14 × el cuerpo de letra, con 0,37 × el cuerpo de separación. En el logo de Inicio no va: se probó y no quedaba bien. La geometría está también en `scripts/generate-brand-assets.swift` (iconos y splash): si cambia, cámbiala en los dos. Icono de la app: variante "Lavanda" de la hoja de marca (círculo blanco + melocotón sobre lavanda); hay también "Claro" (sobre `mist`) y "Oscuro".
En prosa, "MEEET" o "meeet". Nunca "Meet" ni "Meeet".

**Lema:** `Every event. Everyone.` (va en inglés aunque la interfaz esté en español).

**Paleta** (`src/theme.ts`, importa `COLORS` desde `@/theme`):

| Token        | Hex       | Uso |
|--------------|-----------|-----|
| `accent`     | `#8F78F5` | Violeta de marca: cruce del imagotipo, punto del logo, botón "Voy", fechas, iconos activos, pins del mapa |
| `accentSoft` | `#EFEBFF` | Fondo de estados activos ("Voy" ya marcado) y de botones secundarios |
| `peach`      | `#FFCFC2` | Círculo del imagotipo, confeti, degradado de "Voy" |
| `danger`     | `#FF3B30` | Solo para los badges de notificaciones sin leer |
| `lavender`   | `#C7B8FF` | Círculo del imagotipo, confeti, iconos decorativos/vacíos |
| `text`       | `#2A2540` | Tinta de la marca: logotipo, títulos, texto principal y CTA neutro ("Comprar entrada") |
| `peachMid` / `peachDeep` | `#FFAE98` / `#F98B6F` | Solo las "eee" del logotipo (con `peach`), de clara a oscura |
| `mist`       | `#FAF8FF` | Fondo lavanda casi blanco de la marca (icono "Claro", tarjetas de marca) |
| `muted`      | `#6E6E73` | Texto secundario, recintos, mensajes |
| `surface`    | `#F5F5F7` | Placeholders de imagen, controles segmentados, chips |
| `line`       | `#E5E5EA` | Separadores hairline |
| `background` / `white` | `#FFFFFF` | Fondo |

**Tema según el fondo del perfil:** el acento de toda la app (botones, chips activos, fechas, pestañas, indicadores, pie de "Meeet In!", punto de los títulos) sale del fondo que eliges en Editar perfil (`PROFILE_BACKGROUNDS[...].accent/accentSoft`). En código, **nunca `COLORS.accent` ni `COLORS.accentSoft` en pantallas o componentes**: usa `useTheme()` y, en estilos, `const makeStyles = (theme: Theme) => StyleSheet.create({...})` + `useThemedStyles(makeStyles)`. `COLORS.accent` (violeta de marca) solo para la identidad: punto del logotipo `meeet.` fuera de Inicio (bienvenida), imagotipo, destellos, iconos y splash. Un fondo nuevo necesita un acento con contraste ≥ 3:1 sobre blanco (lo comprueba `theme.test.ts`). Los `from`/`to` de los fondos son pasteles con algo de color (se subieron de tono para que se distingan entre sí): no los aclares hasta casi blanco.

No escribas colores hex en las pantallas. Si necesitas uno nuevo, añádelo a `COLORS`. Las únicas excepciones admitidas son los blancos translúcidos de los efectos de cristal (`rgba(255,255,255,0.45–0.94)`).

**Estilo visual (estilo Apple, limpio y luminoso):**
- Solo modo claro (`userInterfaceStyle: "light"`). No añadas modo oscuro sin que se pida.
- Formas en píldora: `borderRadius` = altura / 2 (botones de 46 y 54 px). Tarjetas y contenedores, entre 14 y 24.
- Tipografía del sistema con pesos fuertes. Títulos y artistas en `700–800` con `letterSpacing` negativo (de -0.3 a -0.8). Fechas en MAYÚSCULAS, `accent`, `700`, `letterSpacing: 0.4`.
- Imágenes de concierto a sangre: 16:9 en la lista y hero de 440 px en el detalle.
- Cristal: `BlurView` (`tint="light"`) y una capa blanca translúcida encima. Insignias blancas sobre las imágenes.
- Margen lateral estándar: 20 px.
- Microinteracciones: háptica en las acciones clave (`expo-haptics`), muelle de escala y confeti con `accent`/`peach`/`lavender`.
- Iconos: `Ionicons` de `@expo/vector-icons`.

**Voz y copy:**
- La interfaz va en **español de España** y se tutea: "Voy", "¿Te vienes?", "Sé el primero en apuntarte", "Comprar entrada".
- Frases cortas, cercanas y sociales. El concepto central es *ir juntos*.
- Pluraliza bien: `1 persona va` / `N personas van`.
- Los errores se dicen en lenguaje llano: "No se han podido cargar los conciertos: …".
- Fechas con `toLocaleDateString('es-ES')` y la primera letra en mayúscula: `Sáb, 25 oct · 21:00`.

## Convenciones de código

- Componentes funcionales con `export default function` en las rutas y exports con nombre en `components/` (`export function GoButton`).
- Archivos en `kebab-case.tsx`.
- Estilos con `StyleSheet.create` al final del archivo, alimentados por `COLORS`. Los estilos inline solo para valores dinámicos.
- Orden de imports: primero los externos, una línea en blanco y luego los internos con `@/`.
- Comillas simples, punto y coma, 2 espacios, trailing commas.
- Los comentarios del código propio van en español (por ejemplo, los "Ajustes del banner" de `index.tsx`).
- Las constantes de ajuste visual van en `UPPER_SNAKE_CASE` al principio del archivo.
- El estado global va por `useApp()`. No añadas librerías de estado sin preguntar.
- **Varias ticketeras:** un concierto tiene `offers` (una por fuente, la más barata primero). El botón de compra es uno solo, elegido con `buyOffer` (`offers.ts`): Ticketmaster si está, otra ticketera si no, y la agenda BCN solo cuando no hay ninguna (no vende). **La interfaz nunca dice de qué fuente viene un concierto** (ni pastillas ni "Comprar en Ticketmaster"): el botón dice "Comprar entradas" o "Entrada gratuita" (`priceMin === 0`), y no se listan otras ticketeras. Nunca uses una URL de compra suelta. Los ids llevan el prefijo de la fuente (`ticketmaster-…`). Fever, DICE, Entradas.com y The Project aún no tienen acceso (no hay API pública: hace falta un acuerdo de socio). Cuando lo haya, sus claves irán en un backend propio, nunca en `EXPO_PUBLIC_*`.
- **MusicBrainz:**
  - Normas: máximo 1 petición por segundo (`throttledGet` ya encola y reintenta los 503) y un User-Agent con contacto (`EXPO_PUBLIC_MUSICBRAINZ_CONTACT` en `.env.local`). Las peticiones se hacen solo al abrir el detalle de un concierto, nunca en bucle sobre la lista.
  - Licencia: gratis para uso no comercial y mientras la app no sea pública (plan "Stealth Start-Up" de MetaBrainz). **Al lanzar la app, contratar un plan comercial** (Bronze, desde 100 $/mes) o mover estas consultas a un backend con caché.
  - Ante la duda entre homónimos, `pickArtist` devuelve null: mejor no mostrar nada que mostrar a otro artista. No relajes esa regla sin tests.
- Toda la transformación de datos externos se hace en `src/data/`. Las pantallas consumen el tipo `Concert` y nunca la respuesta cruda de Ticketmaster.
- Los campos `info` y `pleaseNote` de Ticketmaster vienen en texto plano (es/en/ca) con la letra pequeña mezclada. Si aparece un nuevo tipo de aviso, añade su encabezado a `LOGISTICS_MARKERS` en `event-info.ts`. No muestres nunca el texto crudo.
- Usa `useSafeAreaInsets()` para los márgenes superiores en las pantallas con cabecera propia (`headerShown: false`). En las pantallas que están dentro de `(tabs)`, suma `BottomTabInset` al margen inferior para que la barra de pestañas no tape el contenido.
- API estricta de tipos de React Native (por defecto desde SDK 58): las refs se tipan con la instancia, no con el componente (`useRef<ScrollViewInstance>(null)`, `useRef<HostInstance>(null)` para un View); nada de `react-native/Libraries/*`; en `ListHeaderComponent`/`ListEmptyComponent`/`ListFooterComponent` usa `undefined`, no `null`. Las NativeTabs se importan de `expo-router/native-tabs` (ya estables).
- Animaciones: el código de MEEET usa la API `Animated` de React Native. Crea los valores con `useAnimatedValue(0)` y nunca con `useRef(new Animated.Value(0)).current`: el React Compiler y la regla `react-hooks/refs` lo prohíben. Para animaciones nuevas y complejas, prefiere `react-native-reanimated`, que ya está instalado.
- `react-native-maps`, `expo-video` y `expo-media-library` requieren un development build: no funcionan en Expo Go. Permisos (en `app.json`): fotos, guardar en Fotos, cámara y micrófono (vídeos del chat); el texto del micrófono va igual en `expo-image-picker` y `expo-audio`, porque este último lo sobrescribe.
- Antes de dar algo por terminado: `npm run check`.

## Deuda conocida

- Los iconos y el splash salen del imagotipo con `scripts/generate-brand-assets.swift`. `splash-icon.png` debe ser 3:1, porque `splash-overlay.tsx` lo pinta con `aspectRatio: 3`.
- El violeta de marca (`#8F78F5`) sobre blanco tiene un contraste de ~3,3:1: vale para textos grandes y en negrita, pero se queda corto (WCAG AA pide 4,5:1) para textos pequeños como las fechas de 12 pt.
- Los cambios de icono o splash solo se ven en un build nuevo (`npx expo run:ios|android` o EAS). Expo Go no los muestra.
- Si cambias plugins o permisos en `app.json` y ya existe `ios/`, `expo run:ios` **no** los aplica: regenera antes con `npx expo prebuild --platform ios --clean` (la carpeta `ios/` está en .gitignore).
- Build local de iOS: `PATH="/opt/homebrew/bin:$PATH" npx expo run:ios` (CocoaPods de Homebrew).
- `README.md` es el de la plantilla.
