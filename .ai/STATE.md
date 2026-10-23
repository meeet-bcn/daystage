# Estado de trabajo — MEEET

_Actualizado: 2026-10-23_

## Estado actual
- Pestañas: Inicio · Descubrir (placeholder) · meeet in (planes + badge de chat sin leer, aún sin datos).
- Inicio: avatar de perfil (placeholder `/profile`), chips de fecha, hoja `/filters` (orden, cuándo, género, precio).
- Detalle: info limpia de Ticketmaster (`event-info.ts`): reseña + puertas/telonero/edad.
- Datos multi-fuente: `src/data/sources/` + `merge.ts`. Solo Ticketmaster activo.

## Verificación
- `npx tsc --noEmit`: OK · `npx expo lint`: 0 problemas.
- Parser de info y fusión probados contra 30 eventos reales + duplicados simulados (scripts fuera del repo, en el scratchpad de la sesión: no persisten).
- No probado en simulador/dispositivo.

## Pendiente
- Acceso a Fever / DICE / Entradas.com / The Project (requiere acuerdos de socio) → backend propio para sus claves.
- La clave de Ticketmaster va en el bundle (`EXPO_PUBLIC_`).
- Splash, iconos y README siguen siendo los de la plantilla de Expo.
- Archivos de plantilla sin uso (ver CLAUDE.md › Deuda conocida).
- Sin git: el shim de git de macOS está bloqueado por la licencia de Xcode.
- Sin framework de tests.

## Siguiente acción recomendada
Aceptar la licencia de Xcode → `git init` + primer commit → añadir tests (jest-expo) para `event-info`, `filters` y `merge`.
