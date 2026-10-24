# Estado de trabajo — MEEET

_Actualizado: 2026-10-24_

## Estado actual
- Expo SDK 58 (React Native 0.88, React 19.3). Actualizado el 2026-10-24: tipos estrictos de RN, NativeTabs estables.
- Pestañas: Inicio · Descubrir (cartas tipo Tinder según tus gustos) · Meeet in (planes + chat de cada uno) · Perfil · Buscar (botón de búsqueda del sistema, iOS 26).
- Marca según la hoja de marca: violeta #8F78F5, lavanda #C7B8FF, melocotón #FFCFC2, tinta #2A2540. Logo "meeet." centrado, con las "eee" en salmón de claro a oscuro. Icono de app: variante Lavanda con el imagotipo.
- Inicio: cabecera fija centrada (logo, lema, aviso beta) y chips Filtros · Hoy · Mañana · Próxima semana · Calendario. Conciertos por páginas de 20 al hacer scroll (~130 en Barcelona).
- "Meeet In!" sustituye a "Voy" (botón e insignia con el imagotipo animado). Pie de foto con degradado si vas.
- Calendario: intervalo de días, cabecera de cristal fija, carga más páginas al bajar y "Quitar fechas" vacía la caché.
- Chat: una sala por concierto, desde Meeet in o desde el detalle si vas («Ir a la sala de chat»). Fotos y vídeos (galería o cámara) con visor a pantalla completa y guardar en Fotos. Información: Gente · Fotos · Vídeos · Setlist (setlist.fm). En memoria y solo local (no hay servidor). Meeet in: pasados abajo, plegables.
- Ajustes (Perfil › engranaje): idioma principal, privacidad, notificaciones, vibración, sonidos, caché, borrar datos. Privacidad y notificaciones solo se guardan.
- Fuente nueva: Agenda Cultural del Ajuntament de Barcelona (Open Data BCN, CC BY 4.0), ~830 conciertos. Funciona en desarrollo sirviendo el archivo desde el Mac (`npm run feed:build` + `npm run feed:serve`). Código en https://github.com/meeet-bcn/meeet (público). La app lee https://meeet-bcn.github.io/meeet/bcn-concerts.json (rama gh-pages, la sube este Mac con `npm run feed:publish`; Open Data BCN bloquea a GitHub Actions con 403). Pages publica la rama gh-pages y la tarea diaria (launchd, 7:00) está instalada en el Mac; registro en ~/Library/Logs/meeet-bcn-agenda.log. Verificado: la app lee la agenda de GitHub Pages.
- Tema: el acento de toda la app sale del fondo del perfil (16 fondos pastel con su acento, contraste ≥ 3:1). La marca (logo, imagotipo, icono) sigue en violeta.
- Perfil: cabecera de cristal fija, cuadrícula en tres columnas (Meeet in · Lista de deseos · Pasados), pastillas de cristal teñidas por el fondo, pronombres a elegir.
- Lista de deseos con corazón en Inicio y en el detalle.
- Inicio: tirar para recargar con el imagotipo, sonido y explosión de destellos; tocar Inicio sube arriba; primera carga con el imagotipo en el centro. Brillos al darle a "Meeet In!".
- Todas las pestañas: cabecera fija de cristal y `disableAutomaticContentInsets` (sin el margen doble de iOS).
- Perfil: foto (también en la pestaña), nick, nombre, pronombres, bio, redes (Instagram/TikTok/X) y canción con fragmento de Apple Music.
- Detalle: fragmento de la canción más popular del artista (iTunes). La interfaz no nombra las fuentes: «Comprar entradas» / «Entrada gratuita», sin pastillas de ticketera (la cita del Ajuntament, solo en Ajustes).
- Tests: 188 (`src/data/*.test.ts` y `src/theme.test.ts`).

## Verificación
- `npm run check` OK (188/188) con SDK 58. `expo-doctor`: 18/20 (los 2 que fallan necesitan red: exp.host y React Native Directory).
- Build de desarrollo iOS con SDK 58 OK en simulador (0 errores); sin abrir con el Metro nuevo (falta reiniciar Metro). Vistos por captura: Inicio, barra de pestañas, calendario, Ajustes, brillos de "Meeet In!", Perfil con fondo y tema, cabeceras fijas en reposo.
- Sin ver en pantalla (el simulador no se puede tocar ni arrastrar): tirar para recargar y su sonido, tocar Inicio para subir, cabeceras al hacer scroll, chat y sus salas, chips de pronombres, aro de la foto en la pestaña, sonido de los fragmentos.

## Pendiente
- Reiniciar Metro (el abierto es de SDK 57) y probar la app con SDK 58.
- Compilar en el iPhone (SDK 58, expo-video, expo-media-library, permisos de cámara y micrófono).
- Sin commit: los cambios de fuentes/chat en el detalle y la actualización a SDK 58. Sin subir: e78027a.
- Decidir: violeta más oscuro para textos pequeños (contraste 3,3:1) y variante del icono de app.
- Chat real y asistentes (backend): idioma, "X personas van" y no leídos dependen de ello.
- Acceso a Fever / DICE / Entradas.com / The Project (acuerdos de socio) → backend propio para sus claves.
- MusicBrainz: plan comercial de MetaBrainz antes del lanzamiento.

## Siguiente acción recomendada
Probar en el iPhone lo no verificado (animación, chat, calendario, búsqueda) y ajustar.
