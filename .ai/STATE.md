# Estado de trabajo — MEEET

_Actualizado: 2026-10-23_

## Estado actual
- Pestañas: Inicio · Descubrir (placeholder) · Meeet in (planes + chat de cada uno) · Perfil · Buscar (botón de búsqueda del sistema, iOS 26).
- Marca según la hoja de marca: violeta #8F78F5, lavanda #C7B8FF, melocotón #FFCFC2, tinta #2A2540. Logo "meeet." centrado, con las "eee" en salmón de claro a oscuro. Icono de app: variante Lavanda con el imagotipo.
- Inicio: cabecera fija centrada (logo, lema, aviso beta) y chips Filtros · Calendario · Idioma. Conciertos por páginas de 20 al hacer scroll (~130 en Barcelona).
- "Meeet In!" sustituye a "Voy" (botón e insignia con el imagotipo animado). Pie de foto con degradado si vas.
- Calendario: intervalo de días, cabecera de cristal fija, carga más páginas al bajar y "Quitar fechas" vacía la caché.
- Idioma: el de la gente que quieres conocer. Aún no filtra (no hay asistentes).
- Chat: solo desde Meeet in (`/chat/[id]`), con salas General e Idioma (tu idioma principal), en memoria y solo local (no hay servidor).
- Ajustes (Perfil › engranaje): idioma principal, privacidad, notificaciones, vibración, sonidos, caché, borrar datos. Privacidad y notificaciones solo se guardan.
- Fuente nueva: Agenda Cultural del Ajuntament de Barcelona (Open Data BCN, CC BY 4.0), ~830 conciertos. Funciona en desarrollo sirviendo el archivo desde el Mac (`npm run feed:build` + `npm run feed:serve`). Código en https://github.com/meeet-bcn/meeet (público). La app lee https://meeet-bcn.github.io/meeet/bcn-concerts.json (rama gh-pages, la sube este Mac con `npm run feed:publish`; Open Data BCN bloquea a GitHub Actions con 403). Falta: Pages con origen «Deploy from a branch» → gh-pages, e instalar la tarea diaria (scripts/com.meeet.bcn-agenda.plist).
- Tema: el acento de toda la app sale del fondo del perfil (16 fondos pastel con su acento, contraste ≥ 3:1). La marca (logo, imagotipo, icono) sigue en violeta.
- Perfil: cabecera de cristal fija, cuadrícula en tres columnas (Meeet in · Lista de deseos · Pasados), pastillas de cristal teñidas por el fondo, pronombres a elegir.
- Lista de deseos con corazón en Inicio y en el detalle.
- Inicio: tirar para recargar con el imagotipo, sonido y explosión de destellos; tocar Inicio sube arriba; primera carga con el imagotipo en el centro. Brillos al darle a "Meeet In!".
- Todas las pestañas: cabecera fija de cristal y `disableAutomaticContentInsets` (sin el margen doble de iOS).
- Perfil: foto (también en la pestaña), nick, nombre, pronombres, bio, redes (Instagram/TikTok/X) y canción con fragmento de Apple Music.
- Detalle: fragmento de la canción más popular del artista (iTunes), sin chat ni insignia de ticketera en la foto.
- Tests: 142 (`src/data/*.test.ts` y `src/theme.test.ts`).

## Verificación
- `npm run check` OK (142/142). `expo-doctor` 21/21 (con Homebrew en el PATH).
- Build de desarrollo iOS OK en simulador. Vistos por captura: Inicio, barra de pestañas, calendario, Ajustes, brillos de "Meeet In!", Perfil con fondo y tema, cabeceras fijas en reposo.
- Sin ver en pantalla (el simulador no se puede tocar ni arrastrar): tirar para recargar y su sonido, tocar Inicio para subir, cabeceras al hacer scroll, chat y sus salas, chips de pronombres, aro de la foto en la pestaña, sonido de los fragmentos.

## Pendiente
- Compilar en el iPhone (dependencias nativas nuevas: expo-audio, expo-asset, react-native-view-shot; icono y splash nuevos).
- Decidir: violeta más oscuro para textos pequeños (contraste 3,3:1) y variante del icono de app.
- Chat real y asistentes (backend): idioma, "X personas van" y no leídos dependen de ello.
- Acceso a Fever / DICE / Entradas.com / The Project (acuerdos de socio) → backend propio para sus claves.
- MusicBrainz: plan comercial de MetaBrainz antes del lanzamiento.

## Siguiente acción recomendada
Probar en el iPhone lo no verificado (animación, chat, calendario, búsqueda) y ajustar.
