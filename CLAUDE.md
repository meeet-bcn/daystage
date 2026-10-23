@AGENTS.md

# MEEET

App móvil (Expo SDK 57, React Native 0.86, React 19, TypeScript estricto) para descubrir conciertos y decir **"Voy"**. Beta, solo Barcelona. Los datos vienen de la Ticketmaster Discovery API. Plataforma principal: iOS/Android. Web existe por la plantilla, pero no es prioritaria.

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
      index.tsx             # Inicio: cabecera fija (logo y lema que se encogen, aviso beta, chips Filtros · Calendario · Idioma siempre visibles) y lista filtrada que carga más al bajar
      descubrir.tsx         # Descubrir: recomendaciones según tus gustos (de momento, un placeholder)
      buscar.tsx            # Buscar (botón de búsqueda del sistema en la barra): conciertos cargados + búsqueda en las ticketeras
      meeet-in.tsx          # meeet in: próximos planes y acceso al chat, con su burbuja de no leídos
      perfil.tsx            # Perfil estilo Instagram: nick, foto, meeet in / seguidores / seguidos, bio y cuadrícula de planes (pasados al 50 %)
    concert/[id].tsx        # Detalle (fuera de las pestañas): hero, "Meeet In!", comprar entrada, compartir, fragmento de la canción más popular del artista, pestañas Información/Lugar (sin chat)
    chat/[id].tsx           # Chat de un concierto, solo desde Meeet in: el evento y su fecha arriba (sin foto ni comprar) y los mensajes
    filters.tsx             # Hoja nativa (formSheet): ordenar, género, precio
    calendar.tsx            # Hoja del calendario: intervalo de días, con punto en los días con conciertos; al bajar por los meses pide más páginas y "Quitar fechas" vacía la caché (`trimConcerts`)
    language.tsx            # Hoja del idioma de la gente que quieres conocer (aún no filtra: no hay asistentes)
    edit-profile.tsx        # Modal de editar perfil: foto, nick (@, reglas tipo Instagram), nombre, pronombres, bio, canción y redes (Instagram, TikTok, X); solo se aplica al pulsar "Guardar"
  components/
    go-button.tsx           # Botón "Meeet In!" (antes "Voy"): confeti y háptica. Es el componente central de la marca
    imagotipo.tsx           # Imagotipo de la marca (dos círculos), con Views. `ImagotipoAnimado`: los círculos se juntan en uno y se separan, en bucle (insignia "Meeet In!")
    chip.tsx                # Chip en píldora (filtros, opciones)
    search-bar.tsx          # Buscador en píldora (Inicio)
    event-image.tsx         # Foto 16:9 del concierto, igual en Inicio y en el detalle: ticketera arriba a la izquierda (solo en Inicio: en el detalle ya está en "Comprar"), insignia "Meeet In!" con el imagotipo animado abajo a la izquierda
    source-badge.tsx        # Insignia de la ticketera: su nombre en una pastilla blanca, con "+N" si hay más
    holo-frame.tsx          # Pie de foto con degradado animado (56 pt, bajo la insignia "Voy") dentro de la foto; solo si vas
    profile-avatar.tsx      # Avatar circular: foto opcional con icono de reserva
    tab-avatar.tsx          # Genera la miniatura circular de tu foto para la pestaña Perfil
    song-row.tsx            # Fila de canción: carátula, título, artista y play del fragmento
    song-picker.tsx         # Hoja para buscar en Apple Music y elegir la canción del perfil
    profile-song.tsx        # Tarjeta de la canción en Perfil, con el enlace a Apple Music
    screen-title.tsx        # Título grande con el punto melocotón, para pantallas de pestaña
    app-tabs.tsx            # NativeTabs (iOS/Android): Inicio · Descubrir · Meeet in · Perfil, con el badge de no leídos
    app-tabs.web.tsx        # Barra de pestañas para web (expo-router/ui), con un punto rojo como badge
    splash-overlay*.tsx     # Relevo del splash nativo con fundido (en web no hace nada)
  data/
    concerts.ts             # Tipos `Concert` / `TicketOffer` + fetchConcerts({ page, keyword }): una página de todas las fuentes en paralelo (si falla una, sigue con las demás). La fusión se hace en app-context con todas las páginas juntas
    sources/                # Una ticketera por archivo (`EventProvider`)
      index.ts              # PROVIDERS: fuentes activas en orden de prioridad + cómo añadir una nueva
      types.ts              # TicketSource, SOURCE_NAMES, EventProvider
      ticketmaster.ts       # Discovery API → Concert
    merge.ts                # Deduplica entre fuentes (mismo día + sala + artista) y junta las ofertas
    format.ts               # formatDate / toTimestamp / formatPriceRange, comunes a todas las fuentes
    text.ts                 # foldText / compactText / headlinerName: comparaciones sin acentos ni signos, y artista principal de un evento
    songs.ts                # Búsqueda de canciones en Apple Music (API de iTunes) → ProfileSong
    musicbrainz.ts          # Info de artistas (tipo, país, géneros, enlaces). pickArtist solo acepta coincidencias seguras
  hooks/use-artist-info.ts  # Carga la info de MusicBrainz para el detalle (Info › "Sobre el artista", artist-card.tsx)
  hooks/use-song-preview.ts # Reproductor de fragmentos (expo-audio): play/pausa y parar
  hooks/use-concert-search.ts # Búsqueda: al momento en lo cargado y, tras 350 ms, en las ticketeras (`keyword`)
    event-info.ts           # Limpia los textos de Ticketmaster: reseña (`description`, o `info` sin la logística) + puertas, telonero y edad. Descarta los eventos "Test ..."
    filters.ts              # Tipos y opciones de filtros + applyFilters() (funciones puras)
    app-context.tsx         # AppProvider / useApp(): conciertos, "Voy" (guarda copia del concierto), plans, myConcerts, profile, filtros, no leídos
    plans.ts                # isPast / splitPlans / companionsLabel: próximos frente a ya pasados ("X personas van contigo")
    profile.ts              # Tipo Profile, límites y reglas del nick (normalizeNick, nickError)
    profile-photo.ts        # Elegir foto (expo-image-picker, recorte cuadrado) y guardarla en documentos (expo-file-system)
    storage.ts              # Persistencia local (expo-sqlite/kv-store): planes y perfil, claves versionadas (`meeet.plans.v1`…)
  theme.ts                  # ✅ Paleta de MEEET (COLORS). Úsala siempre
  constants/theme.ts        # Medidas de layout: BottomTabInset, MaxContentWidth
assets/images/              # Iconos y splash de MEEET (provisionales: monograma "m." y marca "meeet.")
scripts/generate-brand-assets.swift   # Regenera los PNG de assets/images: `swift scripts/generate-brand-assets.swift`
scripts/generate-tab-icons.swift      # Iconos propios de la barra (casa sin puerta, imagotipo de dos círculos) en assets/images/tabs
```

- Alias de importación: `@/*` → `src/*` y `@/assets/*` → `assets/*`.
- `typedRoutes` y `reactCompiler` están activados en `app.json`. Navega con rutas tipadas: `router.push({ pathname: '/concert/[id]', params: { id } })`.
- Variable de entorno: `EXPO_PUBLIC_TICKETMASTER_KEY` en `.env.local` (no está versionado). Al llevar el prefijo `EXPO_PUBLIC_`, la clave se incrusta en el bundle. No metas ahí secretos de verdad.
- El estado "Voy" (`myEvents`) y los filtros viven solo en memoria y se pierden al reiniciar la app. `going` siempre llega a 0 desde la API: todavía no hay backend de asistentes.
- Los no leídos (`unread` en `app-context.tsx`) siempre están vacíos porque aún no hay chat. Cuando exista, basta con alimentar ese estado y el badge de la pestaña meeet in y la burbuja de cada fila aparecerán solos.
- El badge de una pestaña nativa se pinta solo si `NativeTabs.Trigger.Badge` está en el árbol. En iOS, `hidden` deja un "0" y un badge vacío se ve como un punto: renderízalo de forma condicional.
- Un concierto pasa a "ya fui" cuando termina su día (`isPast`). La API solo trae conciertos futuros, así que los pasados existen únicamente como la copia guardada al decir "Voy": el detalle los busca también en `plans`.
- Calendario e idioma son para turistas: vienen unos días y quieren conocer gente. `Filters.dates` es un intervalo de días incluidos (`DateRange`, medianoches locales); al quitarlas se descartan las páginas cargadas para el calendario (se queda la primera) y la caché de fotos en memoria. `Filters.languages` es el idioma de la gente que quieres conocer, no el del concierto, y aún no filtra nada.
- Conciertos por páginas de 20 (`PAGE_SIZE` en `ticketmaster.ts`), por fecha: Inicio pide la siguiente con `loadMore` al acercarse al final (`onEndReached`). Los filtros se aplican sobre lo cargado; si dejan la lista corta, FlatList sigue pidiendo páginas solo. Barcelona tiene ~130 conciertos de música en Ticketmaster (con el área metropolitana solo salen 3 más).
- Buscar no se queda en lo cargado: también pregunta a las ticketeras (`keyword`) y suma lo que encuentra al estado (`addConcerts`) para que el detalle pueda abrirlo.
- Fotos con `expo-image` (caché en memoria y disco), salvo en `tab-avatar.tsx`, que necesita la `Image` de React Native para capturarla.
- El chat de un concierto solo se abre desde la pestaña Meeet in (`/chat/[id]`), nunca desde el detalle. Solo lleva el evento y su fecha. Aún no hay servidor: los mensajes (`messagesFor`/`sendMessage`) viven en memoria y solo los ve quien los escribe; la pantalla lo avisa.
- El botón y la insignia de "vas a un concierto" dicen "Meeet In!" (internamente sigue siendo `isGoing`/`toggleGoing`). En frases normales ("¡Voy a …! ¿Te vienes?") se puede seguir usando "voy".
- Marco de "Voy": pie de foto de `FOOTER_HEIGHT` pt con el degradado de la marca girando, dentro de la foto y bajo la insignia "Voy" (si cambias su posición en `event-image.tsx`, ajusta el alto). Se probaron trazos finos arriba/abajo y en los 4 lados. Sin efecto holográfico (se probó tinte, reflejo y brillo y se descartó). Respeta "Reducir movimiento". Activo en Inicio y en el detalle.
- Datos del usuario (planes, perfil) se guardan en el móvil con `storage.ts`: se cargan de forma síncrona en el estado inicial y se guardan en un `useEffect`. Si cambias la forma de un dato guardado, sube la versión de su clave.
- Canción del perfil: se busca con la API de búsqueda de iTunes (`songs.ts`, gratis y sin clave) y se oye su fragmento de 30 s con `expo-audio` (`use-song-preview.ts`, un reproductor por pantalla). Condiciones de Apple: el fragmento solo en streaming, nunca descargado, y siempre con el enlace "Escuchar en Apple Music" al lado. La búsqueda solo se lanza mientras escribes en el selector (con espera de 350 ms). En Perfil, la música se para al cambiar de pestaña.
- Redes sociales del perfil: se guarda solo el usuario (sin "@" ni URL; `normalizeHandle` acepta el enlace pegado) y el enlace se construye con `SOCIAL_NETWORKS` en `profile.ts`. Para añadir una red, añádela ahí y a `SOCIAL_ORDER`. Se abren con el enlace web (https), que salta a la app si está instalada.
- Foto de perfil: la URI del selector está en la caché y puede desaparecer. Solo se guarda en el perfil tras copiarla a `Paths.document` (`saveProfilePhoto`), con un nombre nuevo cada vez para que no se vea la foto vieja en caché. La foto anterior se borra.
- La pestaña Perfil muestra tu foto en círculo: NativeTabs no recorta, así que `tab-avatar.tsx` pinta el círculo oculto bajo las pestañas y lo captura en PNG (`react-native-view-shot`), normal y con aro violeta al seleccionarla. Se guarda en `profile.tabIcons` con la foto y el tamaño de los que sale, y se regenera si alguno no coincide (`currentTabIcons`). Sin foto, icono del sistema. Requiere `renderingMode="original"` (si no, iOS lo tiñe) y pasar `scale` en la fuente (si no, sale a tamaño de píxel).
- Iconos de la barra en iOS: todos como imagen (PNG propios de `assets/images/tabs` o `NativeTabs.Trigger.VectorIcon` de Ionicons), nunca SF Symbols mezclados: el símbolo coloca su etiqueta más baja que las imágenes. Inicio = casa sin puerta, Descubrir = las `sparkles` de Ionicons (las de "Recomendaciones para ti"), Meeet in = imagotipo de dos círculos, Perfil = tu foto o `person-circle`.
- Canción del artista en el detalle: `fetchTopSong` coge el primer resultado de iTunes del artista principal (iTunes ordena por relevancia, no da la popularidad). Si hay homónimos (varios `artistId` con ese nombre), `pickTopSong` devuelve null.
- Los nombres de pestaña y los títulos de pantalla van con mayúscula inicial, también "Meeet in" (Inicio · Descubrir · Meeet in · Perfil). El logo, en cambio, siempre en minúscula: `meeet.`.
- En Inicio, el logo, el lema y el aviso beta van centrados (también el logo encogido).
- Los títulos de pestaña (`ScreenTitle`) ocupan la misma caja que el logo de Inicio encogido (`TITLE_SIZE`, `TITLE_LINE_HEIGHT`, `TITLE_TOP`), así que quedan a la misma altura. Inicio importa esas constantes: cámbialas solo ahí.
- Hojas `formSheet` en iOS: si el primer hijo nativo de la pantalla es (o contiene) un ScrollView, su contenido no se pinta. Pon delante otra vista; una vacía necesita `collapsable={false}`, porque si no React Native la elimina al aplanar. Tampoco uses `zIndex` en una capa superpuesta: también deja la lista en blanco. Para una cabecera fija de cristal sobre una lista, usa `stickyHeaderIndices={[0]}` (ver `calendar.tsx`).
- En pantallas cuyo margen superior pones tú (`ScreenTitle`, fotos a sangre), añade `contentInsetAdjustmentBehavior="never"` al ScrollView/FlatList: si no, iOS suma otra vez la zona segura (~59 pt) y el contenido baja.

## Identidad de marca

**Nombre:** se escribe siempre en minúsculas, con tres "e" y un punto violeta: `meeet.`. En el logo, la "m" y la "t" van en tinta y las "eee" en la escala del salmón, de clara a oscura:
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
- **Varias ticketeras:** un concierto tiene `offers` (una por fuente, la más barata primero). Nunca uses una URL de compra suelta. Los ids llevan el prefijo de la fuente (`ticketmaster-…`). Fever, DICE, Entradas.com y The Project aún no tienen acceso (no hay API pública: hace falta un acuerdo de socio). Cuando lo haya, sus claves irán en un backend propio, nunca en `EXPO_PUBLIC_*`.
- **MusicBrainz:**
  - Normas: máximo 1 petición por segundo (`throttledGet` ya encola y reintenta los 503) y un User-Agent con contacto (`EXPO_PUBLIC_MUSICBRAINZ_CONTACT` en `.env.local`). Las peticiones se hacen solo al abrir el detalle de un concierto, nunca en bucle sobre la lista.
  - Licencia: gratis para uso no comercial y mientras la app no sea pública (plan "Stealth Start-Up" de MetaBrainz). **Al lanzar la app, contratar un plan comercial** (Bronze, desde 100 $/mes) o mover estas consultas a un backend con caché.
  - Ante la duda entre homónimos, `pickArtist` devuelve null: mejor no mostrar nada que mostrar a otro artista. No relajes esa regla sin tests.
- Toda la transformación de datos externos se hace en `src/data/`. Las pantallas consumen el tipo `Concert` y nunca la respuesta cruda de Ticketmaster.
- Los campos `info` y `pleaseNote` de Ticketmaster vienen en texto plano (es/en/ca) con la letra pequeña mezclada. Si aparece un nuevo tipo de aviso, añade su encabezado a `LOGISTICS_MARKERS` en `event-info.ts`. No muestres nunca el texto crudo.
- Usa `useSafeAreaInsets()` para los márgenes superiores en las pantallas con cabecera propia (`headerShown: false`). En las pantallas que están dentro de `(tabs)`, suma `BottomTabInset` al margen inferior para que la barra de pestañas no tape el contenido.
- Animaciones: el código de MEEET usa la API `Animated` de React Native. Crea los valores con `useAnimatedValue(0)` y nunca con `useRef(new Animated.Value(0)).current`: el React Compiler y la regla `react-hooks/refs` lo prohíben. Para animaciones nuevas y complejas, prefiere `react-native-reanimated`, que ya está instalado.
- `react-native-maps` requiere un development build: no funciona en Expo Go.
- Antes de dar algo por terminado: `npm run check`.

## Deuda conocida

- La insignia de la ticketera muestra su **nombre en texto**, no su logo. Se probó con el logo oficial de Ticketmaster y se descartó porque no funcionaba bien en la foto (2026-10-23).
- Los iconos y el splash salen del imagotipo con `scripts/generate-brand-assets.swift`. `splash-icon.png` debe ser 3:1, porque `splash-overlay.tsx` lo pinta con `aspectRatio: 3`.
- El violeta de marca (`#8F78F5`) sobre blanco tiene un contraste de ~3,3:1: vale para textos grandes y en negrita, pero se queda corto (WCAG AA pide 4,5:1) para textos pequeños como las fechas de 12 pt.
- Los cambios de icono o splash solo se ven en un build nuevo (`npx expo run:ios|android` o EAS). Expo Go no los muestra.
- Si cambias plugins o permisos en `app.json` y ya existe `ios/`, `expo run:ios` **no** los aplica: regenera antes con `npx expo prebuild --platform ios --clean` (la carpeta `ios/` está en .gitignore).
- Build local de iOS: `PATH="/opt/homebrew/bin:$PATH" npx expo run:ios` (CocoaPods de Homebrew).
- `README.md` es el de la plantilla.
