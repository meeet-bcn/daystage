# Estado de trabajo — MEEET

_Actualizado: 2026-10-23_

## Estado actual
- Pestañas: Inicio · Descubrir (placeholder) · Meeet in (planes + chat de cada uno) · Perfil · Buscar (botón de búsqueda del sistema, iOS 26).
- Marca según la hoja de marca: violeta #8F78F5, lavanda #C7B8FF, melocotón #FFCFC2, tinta #2A2540. Logo "meeet." centrado, con las "eee" en salmón de claro a oscuro. Icono de app: variante Lavanda con el imagotipo.
- Inicio: cabecera fija centrada (logo, lema, aviso beta) y chips Filtros · Calendario · Idioma. Conciertos por páginas de 20 al hacer scroll (~130 en Barcelona).
- "Meeet In!" sustituye a "Voy" (botón e insignia con el imagotipo animado). Pie de foto con degradado si vas.
- Calendario: intervalo de días, cabecera de cristal fija, carga más páginas al bajar y "Quitar fechas" vacía la caché.
- Idioma: el de la gente que quieres conocer. Aún no filtra (no hay asistentes).
- Chat: solo desde Meeet in (`/chat/[id]`), en memoria y solo local (no hay servidor).
- Perfil: foto (también en la pestaña), nick, nombre, pronombres, bio, redes (Instagram/TikTok/X) y canción con fragmento de Apple Music.
- Detalle: fragmento de la canción más popular del artista (iTunes), sin chat ni insignia de ticketera en la foto.
- Tests: 117 en `src/data/*.test.ts`.

## Verificación
- `npm run check` OK (117/117). `expo-doctor` 21/21 (con Homebrew en el PATH).
- Build de desarrollo iOS OK en simulador. Vistos por captura: Inicio, barra de pestañas, calendario.
- Sin ver en pantalla (el simulador no se puede tocar): animación del imagotipo, chat, búsqueda, scroll del calendario, foto en la pestaña, sonido de los fragmentos.

## Pendiente
- Compilar en el iPhone (dependencias nativas nuevas: expo-audio, expo-asset, react-native-view-shot; icono y splash nuevos).
- Decidir: violeta más oscuro para textos pequeños (contraste 3,3:1) y variante del icono de app.
- Chat real y asistentes (backend): idioma, "X personas van" y no leídos dependen de ello.
- Acceso a Fever / DICE / Entradas.com / The Project (acuerdos de socio) → backend propio para sus claves.
- MusicBrainz: plan comercial de MetaBrainz antes del lanzamiento.

## Siguiente acción recomendada
Probar en el iPhone lo no verificado (animación, chat, calendario, búsqueda) y ajustar.
