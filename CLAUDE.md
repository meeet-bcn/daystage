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
    _layout.tsx             # Layout raíz: ThemeProvider + AppProvider + Stack (tabs, concert, filters, profile)
    (tabs)/
      _layout.tsx           # Renderiza <AppTabs />
      index.tsx             # Inicio: avatar arriba a la derecha, chips de fecha y "Filtros", lista filtrada
      descubrir.tsx         # Descubrir: recomendaciones según tus gustos (de momento, un placeholder)
      meeet-in.tsx          # meeet in: conciertos a los que vas y acceso al chat, con su burbuja de no leídos
    concert/[id].tsx        # Detalle (fuera de las pestañas): hero, "Voy", comprar entrada, compartir, pestañas Info/Lugar/Chat. `?tab=chat` abre directamente el chat
    filters.tsx             # Hoja nativa (formSheet): ordenar, cuándo, género, precio
    profile.tsx             # Perfil (de momento, un placeholder)
  components/
    go-button.tsx           # Botón "Voy": confeti y háptica. Es el componente central de la marca
    chip.tsx                # Chip en píldora (filtros, opciones)
    profile-avatar.tsx      # Avatar circular: foto opcional con icono de reserva
    screen-title.tsx        # Título grande con el punto melocotón, para pantallas de pestaña
    app-tabs.tsx            # NativeTabs (iOS/Android): Inicio · Descubrir · meeet in, con el badge de no leídos
    app-tabs.web.tsx        # Barra de pestañas para web (expo-router/ui), con un punto rojo como badge
    animated-icon*.tsx      # Overlay del splash (aún con la marca de Expo)
    themed-*.tsx, hint-row.tsx, web-badge.tsx, external-link.tsx, ui/collapsible.tsx   # Restos de la plantilla, ya no los usa nadie
  data/
    concerts.ts             # Tipos `Concert` / `TicketOffer` + fetchConcerts(): consulta todas las fuentes en paralelo (si falla una, sigue con las demás) y las fusiona
    sources/                # Una ticketera por archivo (`EventProvider`)
      index.ts              # PROVIDERS: fuentes activas en orden de prioridad + cómo añadir una nueva
      types.ts              # TicketSource, SOURCE_NAMES, EventProvider
      ticketmaster.ts       # Discovery API → Concert
    merge.ts                # Deduplica entre fuentes (mismo día + sala + artista) y junta las ofertas
    format.ts               # formatDate / toTimestamp / formatPriceRange, comunes a todas las fuentes
    event-info.ts           # Limpia los textos de Ticketmaster: reseña (`description`, o `info` sin la logística) + puertas, telonero y edad. Descarta los eventos "Test ..."
    filters.ts              # Tipos y opciones de filtros + applyFilters() (funciones puras)
    app-context.tsx         # AppProvider / useApp(): conciertos, "Voy", myConcerts, filtros, visibleConcerts, no leídos
  theme.ts                  # ✅ Paleta de MEEET (COLORS). Úsala siempre
  constants/theme.ts        # Tema de la plantilla. Para colores no lo uses; solo BottomTabInset / MaxContentWidth
  hooks/                    # use-theme / use-color-scheme (de la plantilla)
assets/images/              # Iconos y splash (todavía los de Expo)
```

- Alias de importación: `@/*` → `src/*` y `@/assets/*` → `assets/*`.
- `typedRoutes` y `reactCompiler` están activados en `app.json`. Navega con rutas tipadas: `router.push({ pathname: '/concert/[id]', params: { id } })`.
- Variable de entorno: `EXPO_PUBLIC_TICKETMASTER_KEY` en `.env.local` (no está versionado). Al llevar el prefijo `EXPO_PUBLIC_`, la clave se incrusta en el bundle. No metas ahí secretos de verdad.
- El estado "Voy" (`myEvents`) y los filtros viven solo en memoria y se pierden al reiniciar la app. `going` siempre llega a 0 desde la API: todavía no hay backend de asistentes.
- Los no leídos (`unread` en `app-context.tsx`) siempre están vacíos porque aún no hay chat. Cuando exista, basta con alimentar ese estado y el badge de la pestaña meeet in y la burbuja de cada fila aparecerán solos.
- Los nombres de pestaña se escriben en minúscula como la marca: "meeet in".

## Identidad de marca

**Nombre:** se escribe siempre en minúsculas, con tres "e" y un punto color melocotón: `meeet.`
```tsx
<Text style={{ color: COLORS.accent, fontWeight: '800' }}>
  meeet<Text style={{ color: COLORS.peach }}>.</Text>
</Text>
```
En prosa, "MEEET" o "meeet". Nunca "Meet" ni "Meeet".

**Lema:** `Every event. Everyone.` (va en inglés aunque la interfaz esté en español).

**Paleta** (`src/theme.ts`, importa `COLORS` desde `@/theme`):

| Token        | Hex       | Uso |
|--------------|-----------|-----|
| `accent`     | `#7B5CFA` | Violeta de marca: logo, botón "Voy", fechas, iconos activos, pins del mapa |
| `accentSoft` | `#EFEAFE` | Fondo de estados activos ("Voy" ya marcado) y de botones secundarios |
| `peach`      | `#FFC9A8` | Punto del logo, confeti |
| `danger`     | `#FF3B30` | Solo para los badges de notificaciones sin leer |
| `lavender`   | `#C9B8F5` | Confeti, iconos decorativos/vacíos |
| `text`       | `#1D1D1F` | Texto principal y CTA neutro ("Comprar entrada") |
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
- Toda la transformación de datos externos se hace en `src/data/`. Las pantallas consumen el tipo `Concert` y nunca la respuesta cruda de Ticketmaster.
- Los campos `info` y `pleaseNote` de Ticketmaster vienen en texto plano (es/en/ca) con la letra pequeña mezclada. Si aparece un nuevo tipo de aviso, añade su encabezado a `LOGISTICS_MARKERS` en `event-info.ts`. No muestres nunca el texto crudo.
- Usa `useSafeAreaInsets()` para los márgenes superiores en las pantallas con cabecera propia (`headerShown: false`). En las pantallas que están dentro de `(tabs)`, suma `BottomTabInset` al margen inferior para que la barra de pestañas no tape el contenido.
- Animaciones: el código de MEEET usa la API `Animated` de React Native. Crea los valores con `useAnimatedValue(0)` y nunca con `useRef(new Animated.Value(0)).current`: el React Compiler y la regla `react-hooks/refs` lo prohíben. Para animaciones nuevas y complejas, prefiere `react-native-reanimated`, que ya está instalado.
- `react-native-maps` requiere un development build: no funciona en Expo Go.
- Antes de dar algo por terminado: `npm run check`.

## Deuda conocida

- `themed-*`, `hint-row`, `web-badge`, `external-link`, `ui/collapsible`, `hooks/use-theme` y `hooks/use-color-scheme*`, igual que `assets/images/tabIcons/`, `tutorial-web.png` y `react-logo*`, ya no los usa nadie. Se pueden borrar.
- El splash (`#208AEF` y el logo de Expo), los iconos de la app y el fondo del icono adaptativo de Android siguen siendo los de Expo. Habría que cambiarlos por la marca MEEET.
- `README.md` es el de la plantilla.
