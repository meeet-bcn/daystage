# Estado de trabajo — MEEET

_Actualizado: 2026-10-23_

## Estado actual
- Pestañas: Inicio · Descubrir (placeholder) · meeet in (próximos planes + badge de chat) · Perfil (estilo Instagram, datos de perfil vacíos hasta tener cuentas).
- Inicio: buscador (artista/sala/género/telonero, sin acentos), chips de fecha, hoja `/filters`.
- Foto de evento 16:9 común (`event-image.tsx`) en Inicio y detalle, con insignia de ticketera (nombre en texto; el logo se probó y se descartó).
- Detalle: info limpia de Ticketmaster (`event-info.ts`): reseña + puertas/telonero/edad.
- Datos multi-fuente: `src/data/sources/` + `merge.ts`. Solo Ticketmaster activo.
- Detalle › Info › "Sobre el artista": MusicBrainz (tipo, país, año de formación, géneros, enlaces). Prueba real: 21/28 artistas, 0 errores de emparejamiento.
- Git: todo en `main` (ver `git log`). bundleIdentifier confirmado: `com.elcantantemudo.meeet`.
- Tests: jest-expo 57 (Jest 29). 87 tests en `src/data/*.test.ts` (event-info, filters + búsqueda, merge, musicbrainz, plans, text). Nota: jest-expo simula `fetch`; las pruebas contra APIs reales se hacen con Node fuera de Jest.
- Desktop Commander registrado en Claude Code (ámbito usuario). Disponible a partir de la próxima sesión.

## Verificación
- `npm run check` (tsc + expo lint + jest): OK, 87/87. `expo-doctor`: 21/21.
- Mutation check: romper la normalización de `merge.ts` hace fallar 2 tests.
- Build de desarrollo iOS OK en simulador (iPhone 17 Pro): Inicio y barra de 4 pestañas verificados por captura. Pantalla Perfil aún sin captura (simctl no puede tocar la pantalla).

## Pendiente
- Planes y perfil persistidos con `expo-sqlite/kv-store` (`src/data/storage.ts`).
- Perfil sin edición (nick, nombre, bio, foto) ni seguidores reales: necesita cuentas y backend.
- Acceso a Fever / DICE / Entradas.com / The Project (requiere acuerdos de socio) → backend propio para sus claves.
- La clave de Ticketmaster va en el bundle (`EXPO_PUBLIC_`).
- MusicBrainz: plan comercial de MetaBrainz antes del lanzamiento. Contacto del User-Agent ya configurado en `.env.local`.
- Iconos/splash de MEEET provisionales. Build local: Homebrew + CocoaPods 1.17 (`/opt/homebrew/bin/pod`).
- Dependencias posiblemente sin uso tras la limpieza: expo-web-browser, expo-symbols, expo-glass-effect, expo-device, @expo/ui, expo-system-ui (sin verificar).

## Siguiente acción recomendada
Pantalla de editar perfil (nick, nombre, bio, foto recortada en círculo).
