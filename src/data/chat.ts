// Utilidades de las salas de chat (como Telegram o WhatsApp): mensajes de
// texto o foto, separadores por día y los enlaces compartidos.

/** Mensaje de una sala: texto, foto o vídeo. Sin cuenta (modo local), solo los tuyos. */
export type ChatMessage = {
  id: string;
  sentAt: number;
  text: string;
  /** URI de la foto, si es una foto. */
  photo?: string;
  /** URI del vídeo, si es un vídeo. */
  video?: string;
  /** Con cuenta (Supabase): quién lo escribió y si eres tú. Sin cuenta, siempre tuyo. */
  userId?: string;
  mine?: boolean;
  /** Ruta en Storage de la foto o el vídeo (su URL firmada va en `photo`/`video`). */
  mediaPath?: string;
};

/**
 * Clave de la sala de un concierto: una sola por concierto. Es la de la
 * antigua sala "General", así los mensajes de antes siguen ahí.
 */
export const chatKey = (concertId: string) => `${concertId}:general`;

/** "1 miembro" / "N miembros" de una sala: tú y quien más va. */
export const membersLabel = (count: number) => `${count} ${count === 1 ? 'miembro' : 'miembros'}`;

/** Etiqueta del día de un mensaje: «Hoy», «Ayer» o la fecha. */
export function dayLabel(time: number, now = Date.now()) {
  const day = (t: number) => new Date(t).toDateString();
  if (day(time) === day(now)) return 'Hoy';
  if (day(time) === day(now - 24 * 60 * 60 * 1000)) return 'Ayer';
  const label = new Date(time).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type ChatRow =
  | { kind: 'day'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessage };

/** Mensajes en orden con un separador antes del primero de cada día. */
export function withDaySeparators(messages: ChatMessage[], now = Date.now()): ChatRow[] {
  const rows: ChatRow[] = [];
  let lastDay = '';
  for (const message of [...messages].sort((a, b) => a.sentAt - b.sentAt)) {
    const day = new Date(message.sentAt).toDateString();
    if (day !== lastDay) {
      rows.push({ kind: 'day', id: `day-${day}`, label: dayLabel(message.sentAt, now) });
      lastDay = day;
    }
    rows.push({ kind: 'message', id: message.id, message });
  }
  return rows;
}
