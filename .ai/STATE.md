# Estado de trabajo — MEEET

_Actualizado: 2026-10-23_

## Estado actual
- Pestañas: Inicio · Descubrir (placeholder) · meeet in (planes + badge de chat sin leer, aún sin datos).
- Inicio: avatar de perfil (placeholder `/profile`), chips de fecha, hoja `/filters` (orden, cuándo, género, precio).
- Detalle: info limpia de Ticketmaster (`event-info.ts`): reseña + puertas/telonero/edad.
- Datos multi-fuente: `src/data/sources/` + `merge.ts`. Solo Ticketmaster activo.
- Git: repo local en `main`, commit inicial `a8a1e92`. Tests y scripts nuevos aún sin commit.
- Tests: jest-expo 57 (Jest 29). 31 tests en `src/data/*.test.ts` (event-info, filters, merge).
- Desktop Commander registrado en Claude Code (ámbito usuario). Disponible a partir de la próxima sesión.

## Verificación
- `npm run check` (tsc + expo lint + jest): OK, 31/31.
- Mutation check: romper la normalización de `merge.ts` hace fallar 2 tests.
- No probado en simulador/dispositivo.

## Pendiente
- Acceso a Fever / DICE / Entradas.com / The Project (requiere acuerdos de socio) → backend propio para sus claves.
- La clave de Ticketmaster va en el bundle (`EXPO_PUBLIC_`).
- Splash, iconos y README siguen siendo los de la plantilla de Expo.
- Archivos de plantilla sin uso (ver CLAUDE.md › Deuda conocida). Ahora que hay git, se pueden borrar de forma segura.

## Siguiente acción recomendada
Commit de los tests → borrar los restos de la plantilla → splash/iconos de MEEET.
