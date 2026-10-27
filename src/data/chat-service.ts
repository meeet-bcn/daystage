// Servicio del backend (Supabase): asistencia, perfil y salas de chat con
// mensajes paginados, Realtime, fotos y vídeos en Storage, no leídos,
// bloqueos y denuncias. Todo pasa por RLS (supabase/migrations). Las
// funciones fallan con un Error si no hay backend: compruébalo antes con
// `backendEnabled`.

import type { ChatMessage } from '@/data/chat';
import type { Concert } from '@/data/concerts';
import { canonicalConcertId } from '@/data/merge';
import type { Profile } from '@/data/profile';
import {
  concertToRow,
  countsByKey,
  mediaUpload,
  messageFromRow,
  type MessageRow,
  profileToRow,
} from '@/data/remote';
import { CHAT_MEDIA_BUCKET, supabase } from '@/data/supabase';

export const PAGE_SIZE = 40;
const SIGNED_URL_SECONDS = 60 * 60;

function client() {
  if (!supabase) throw new Error('No hay servidor configurado.');
  return supabase;
}

/** Id de la sala de un concierto (= id del concierto en el servidor). */
export const roomIdFor = (concert: Concert) => canonicalConcertId(concert);

// --- Asistencia --------------------------------------------------------------

/** Sube lo mínimo del concierto (si ya está, no lo toca); el servidor crea su sala. */
async function ensureConcert(concert: Concert) {
  const { error } = await client()
    .from('concerts')
    .upsert(concertToRow(concert), { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}

/** "¡Voy!" en el servidor: apuntarte (y entrar en la sala) o desapuntarte. */
export async function setAttendance(concert: Concert, going: boolean, userId: string) {
  const db = client();
  const concertId = canonicalConcertId(concert);
  if (going) {
    await ensureConcert(concert);
    const { error } = await db
      .from('attendance')
      .upsert({ user_id: userId, concert_id: concertId }, { ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await db
      .from('attendance')
      .delete()
      .eq('user_id', userId)
      .eq('concert_id', concertId);
    if (error) throw error;
  }
}

/** Cuánta gente va a cada concierto, por id canónico (también sin cuenta). */
export async function fetchGoingCounts(concertIds: string[]) {
  if (concertIds.length === 0) return {};
  const { data, error } = await client().rpc('going_counts', { concert_ids: concertIds });
  if (error) throw error;
  return countsByKey(data as { concert_id: string; going: number }[], 'concert_id', 'going');
}

// --- Perfil --------------------------------------------------------------------

export async function upsertProfile(profile: Profile, userId: string) {
  const { error } = await client()
    .from('profiles')
    .upsert({ id: userId, ...profileToRow(profile), updated_at: new Date().toISOString() });
  if (error) throw error;
}

// --- Mensajes ------------------------------------------------------------------

/** URL firmadas (1 h) de las fotos y vídeos de estas filas, por ruta. */
async function signedUrls(rows: MessageRow[]) {
  const paths = [...new Set(rows.map((r) => r.media_path).filter((p): p is string => p != null))];
  if (paths.length === 0) return {};
  const { data, error } = await client()
    .storage.from(CHAT_MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  return out;
}

async function toMessages(rows: MessageRow[], myId: string | null) {
  const urls = await signedUrls(rows);
  return rows.map((r) => messageFromRow(r, myId, urls));
}

/**
 * Una página de mensajes, de los más recientes hacia atrás (`before`: fecha del
 * más antiguo que ya tienes). Devuelve en orden de envío y si quedan más.
 */
export async function fetchMessages(room: string, myId: string | null, before?: number) {
  let query = client()
    .from('messages')
    .select('*')
    .eq('room_id', room)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (before != null) query = query.lt('created_at', new Date(before).toISOString());
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as MessageRow[];
  return { messages: (await toMessages(rows, myId)).reverse(), hasMore: rows.length === PAGE_SIZE };
}

/**
 * Mensajes nuevos de la sala en tiempo real. `onReady` avisa al quedar suscrita:
 * lo enviado entre la primera carga y ese momento no llega por aquí, así que
 * conviene volver a pedir la última página. Devuelve la función para dejar de escuchar.
 */
export function subscribeToRoom(
  room: string,
  myId: string | null,
  onMessage: (message: ChatMessage) => void,
  onReady?: () => void
) {
  const db = client();
  const channel = db
    .channel(`room:${room}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room}` },
      (payload) => {
        toMessages([payload.new as MessageRow], myId)
          .then(([message]) => onMessage(message))
          .catch((e) => console.warn('[chat] Mensaje en tiempo real:', e));
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') onReady?.();
    });
  return () => {
    db.removeChannel(channel);
  };
}

export async function sendText(room: string, text: string, myId: string) {
  const { data, error } = await client()
    .from('messages')
    .insert({ room_id: room, user_id: myId, text })
    .select()
    .single();
  if (error) throw error;
  return messageFromRow(data as MessageRow, myId);
}

/** Sube la foto o el vídeo a Storage y lo envía como mensaje. */
export async function sendMedia(room: string, uri: string, kind: 'image' | 'video', myId: string) {
  const db = client();
  const { path, contentType } = mediaUpload(room, myId, uri, kind);
  const body = await (await fetch(uri)).arrayBuffer();
  const upload = await db.storage.from(CHAT_MEDIA_BUCKET).upload(path, body, { contentType });
  if (upload.error) throw upload.error;
  const { data, error } = await db
    .from('messages')
    .insert({ room_id: room, user_id: myId, media_path: path, media_type: kind })
    .select()
    .single();
  if (error) throw error;
  return (await toMessages([data as MessageRow], myId))[0];
}

// --- No leídos -------------------------------------------------------------------

export async function markRoomRead(room: string, myId: string) {
  const { error } = await client()
    .from('room_reads')
    .upsert({ user_id: myId, room_id: room, last_read_at: new Date().toISOString() });
  if (error) throw error;
}

/** Sin leer por sala (solo las que tienen algo). */
export async function fetchUnreadCounts(rooms: string[]) {
  if (rooms.length === 0) return {};
  const { data, error } = await client().rpc('unread_counts', { room_ids: rooms });
  if (error) throw error;
  return countsByKey(data as { room_id: string; unread: number }[], 'room_id', 'unread');
}

// --- Moderación ------------------------------------------------------------------

/** Dejas de ver sus mensajes (en todas las salas). */
export async function blockUser(userId: string, myId: string) {
  const { error } = await client()
    .from('blocks')
    .upsert({ blocker_id: myId, blocked_id: userId }, { ignoreDuplicates: true });
  if (error) throw error;
}

export async function reportUser(userId: string, myId: string, messageId?: string, reason = '') {
  const { error } = await client().from('reports').insert({
    reporter_id: myId,
    reported_user_id: userId,
    message_id: messageId ?? null,
    reason,
  });
  if (error) throw error;
}
