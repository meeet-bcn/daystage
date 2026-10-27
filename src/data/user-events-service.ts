// Eventos propios en Supabase (user_events, fotos en el bucket event-images).

import type { Concert } from '@/data/concerts';
import { supabase } from '@/data/supabase';
import {
  draftToRow,
  type EventDraft,
  rowToConcert,
  type UserEventRow,
  userEventId,
} from '@/data/user-events';

const BUCKET = 'event-images';

function client() {
  if (!supabase) throw new Error('No hay servidor configurado.');
  return supabase;
}

const imageUrl = (path: string | null) =>
  path ? client().storage.from(BUCKET).getPublicUrl(path).data.publicUrl : '';

export const toConcert = (row: UserEventRow) => rowToConcert(row, imageUrl(row.image_path));

/** Los eventos que puedes ver (públicos, tuyos y privados a los que te invitaron), desde ayer. */
export async function fetchUserEvents(keyword?: string): Promise<Concert[]> {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return []; // RLS: sin sesión no se ve ninguno
  let query = supabase
    .from('user_events')
    .select('*')
    .gte('starts_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString())
    .order('starts_at')
    .limit(200);
  const k = keyword?.trim().replace(/[%_,()]/g, ' ');
  if (k) query = query.or(`title.ilike.%${k}%,venue.ilike.%${k}%`);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as UserEventRow[]).map(toConcert);
}

/** Uno por su id de la app ("user-…"). Si es privado, el enlace sirve de invitación. */
export async function fetchUserEvent(concertId: string): Promise<Concert | null> {
  const db = client();
  const id = userEventId(concertId);
  await db.rpc('join_private_event', { event: id });
  const { data, error } = await db.from('user_events').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toConcert(data as UserEventRow) : null;
}

/** La fila tal cual (para editar). */
export async function fetchUserEventRow(concertId: string) {
  const { data, error } = await client()
    .from('user_events')
    .select('*')
    .eq('id', userEventId(concertId))
    .maybeSingle();
  if (error) throw error;
  return (data as UserEventRow | null) ?? null;
}

async function uploadImage(uri: string, userId: string) {
  const ext = /\.(png|heic|webp)(\?|$)/i.exec(uri)?.[1]?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${Date.now().toString(36)}.${ext}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(path, body, { contentType: ext === 'jpg' ? 'image/jpeg' : `image/${ext}` });
  if (error) throw error;
  return path;
}

/**
 * Crea o actualiza. `photoUri`: una foto nueva de la galería (si no, se queda la
 * que había, `currentImagePath`). Devuelve el evento como Concert.
 */
export async function saveUserEvent(
  draft: EventDraft,
  userId: string,
  options: { concertId?: string; photoUri?: string | null; currentImagePath?: string | null } = {}
): Promise<Concert> {
  const db = client();
  const imagePath = options.photoUri
    ? await uploadImage(options.photoUri, userId)
    : (options.currentImagePath ?? null);
  const row = { ...draftToRow(draft, imagePath), updated_at: new Date().toISOString() };
  const result = options.concertId
    ? await db.from('user_events').update(row).eq('id', userEventId(options.concertId)).select().single()
    : await db.from('user_events').insert({ ...row, created_by: userId }).select().single();
  if (result.error) throw result.error;
  return toConcert(result.data as UserEventRow);
}

export async function deleteUserEvent(concertId: string) {
  const { error } = await client().from('user_events').delete().eq('id', userEventId(concertId));
  if (error) throw error;
}
