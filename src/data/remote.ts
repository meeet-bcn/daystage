// Filas de Supabase ↔ tipos de la app (funciones puras, sin el cliente, para
// poder probarlas). El esquema está en supabase/migrations.

import type { ChatMessage } from '@/data/chat';
import type { Concert } from '@/data/concerts';
import { canonicalConcertId } from '@/data/merge';
import { nickError, type Profile } from '@/data/profile';

export type MessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  text: string;
  media_path: string | null;
  media_type: 'image' | 'video' | null;
  created_at: string;
};

export type ConcertRow = {
  id: string;
  artist: string;
  venue: string;
  starts_at: string | null;
  image: string;
};

export type ProfileRow = {
  nick: string | null;
  name: string;
  bio: string;
  background: string;
};

/**
 * Mensaje de la app desde su fila. `urls` son las URL firmadas de Storage por
 * ruta: sin la suya, la foto o el vídeo aún no se puede mostrar.
 */
export function messageFromRow(
  row: MessageRow,
  myId: string | null,
  urls: Record<string, string> = {}
): ChatMessage {
  const url = row.media_path ? urls[row.media_path] : undefined;
  return {
    id: row.id,
    sentAt: Date.parse(row.created_at),
    text: row.text,
    userId: row.user_id,
    mine: myId != null && row.user_id === myId,
    ...(row.media_path ? { mediaPath: row.media_path } : {}),
    ...(url && row.media_type === 'image' ? { photo: url } : {}),
    ...(url && row.media_type === 'video' ? { video: url } : {}),
  };
}

/** Añade mensajes sin repetir (por id), en orden de envío. */
export function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, { ...byId.get(m.id), ...m });
  return [...byId.values()].sort((a, b) => a.sentAt - b.sentAt);
}

/** Lo mínimo del concierto para el servidor (al decir "¡Voy!"). */
export function concertToRow(concert: Concert): ConcertRow {
  return {
    id: canonicalConcertId(concert),
    artist: concert.artist.slice(0, 200),
    venue: concert.venue.slice(0, 200),
    starts_at: concert.startsAt == null ? null : new Date(concert.startsAt).toISOString(),
    image: concert.image,
  };
}

/** El perfil público. La foto es un archivo del móvil: se subirá aparte (pendiente). */
export function profileToRow(profile: Profile): ProfileRow {
  return {
    // El servidor exige las mismas reglas; un nick que no las cumple no se sube
    nick: profile.nick && nickError(profile.nick) == null ? profile.nick : null,
    name: profile.name.slice(0, 60),
    bio: profile.bio.slice(0, 300),
    background: profile.background,
  };
}

/** [{ id, n }] de una RPC → { id: n }. */
export function countsByKey<K extends string, V extends string>(
  rows: ({ [key in K]: string } & { [value in V]: number })[] | null,
  key: K,
  value: V
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows ?? []) out[row[key]] = row[value];
  return out;
}

const EXTENSIONS: Record<string, string> = { image: 'jpg', video: 'mp4' };
const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

/**
 * Dónde se sube una foto o un vídeo: "<sala>/<usuario>/<nombre>.<ext>" (las
 * políticas de Storage miran la sala y el usuario de la ruta).
 */
export function mediaUpload(room: string, userId: string, uri: string, kind: 'image' | 'video', now = Date.now()) {
  const fromUri = /\.([a-z0-9]{2,4})(?:\?|$)/i.exec(uri)?.[1]?.toLowerCase();
  const ext = fromUri && MIME[fromUri] ? fromUri : EXTENSIONS[kind];
  const name = `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return { path: `${room}/${userId}/${name}.${ext}`, contentType: MIME[ext] };
}
