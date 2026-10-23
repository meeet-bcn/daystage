# Estado de trabajo — MEEET

_Actualizado: 2026-10-23_

## Estado actual
- Pestañas: Inicio · Descubrir (placeholder) · meeet in (planes + badge de chat sin leer, aún sin datos).
- Inicio: avatar de perfil (placeholder `/profile`), chips de fecha, hoja `/filters` (orden, cuándo, género, precio).
- Detalle: info limpia de Ticketmaster (`event-info.ts`): reseña + puertas/telonero/edad.
- Datos multi-fuente: `src/data/sources/` + `merge.ts`. Solo Ticketmaster activo.
- Git: `main` con commits `a8a1e92` (inicial) y `4ca68bf` (tests). Limpieza de la plantilla e iconos de marca: sin commit.
- Tests: jest-expo 57 (Jest 29). 31 tests en `src/data/*.test.ts` (event-info, filters, merge).
- Desktop Commander registrado en Claude Code (ámbito usuario). Disponible a partir de la próxima sesión.

## Verificación
- `npm run check` (tsc + expo lint + jest): OK, 31/31.
- Mutation check: romper la normalización de `merge.ts` hace fallar 2 tests.
- No probado en simulador/dispositivo.

## Pendiente
- Acceso a Fever / DICE / Entradas.com / The Project (requiere acuerdos de socio) → backend propio para sus claves.
- La clave de Ticketmaster va en el bundle (`EXPO_PUBLIC_`).
- Iconos/splash de MEEET provisionales (tipográficos, generados con `scripts/generate-brand-assets.swift`). Sin probar en un build nativo. README sigue siendo el de la plantilla.
- `expo-doctor`: 20/21. Faltan parches del SDK 57: expo 57.0.31, expo-router 57.0.29, @expo/ui 57.0.26 (`npx expo install --fix`). Pendiente de autorización.
- Dependencias posiblemente sin uso tras la limpieza: expo-web-browser, expo-symbols, expo-glass-effect, expo-device, @expo/ui, expo-system-ui (sin verificar).

## Siguiente acción recomendada
Commit de la limpieza → `npx expo install --fix` → build de desarrollo para ver los iconos y el splash.
