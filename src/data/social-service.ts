// Social en Supabase: buscar gente por nick, seguir, seguidores y seguidos,
// días libres compartidos (shared_days, solo entre amigos) y quién va o está
// libre para un concierto. Todo pasa por RLS.

import { type ProfileRow, profileFromRow, type PublicProfile, type SharedDay } from '@/data/social';
import { supabase } from '@/data/supabase';

const PROFILE_FIELDS = 'id, nick, name, photo_url';

function client() {
  if (!supabase) throw new Error('No hay servidor configurado.');
  return supabase;
}

/** Gente cuyo nick empieza por `query` (sin ti). */
export async function searchProfiles(query: string, myId: string): Promise<PublicProfile[]> {
  if (query.length < 2) return [];
  const { data, error } = await client()
    .from('profiles')
    .select(PROFILE_FIELDS)
    .ilike('nick', `${query}%`)
    .neq('id', myId)
    .order('nick')
    .limit(20);
  if (error) throw error;
  return ((data ?? []) as ProfileRow[]).map(profileFromRow);
}

/** A quién sigues y quién te sigue. */
export async function fetchFollowLists(myId: string) {
  const db = client();
  const [following, followers] = await Promise.all([
    db.from('follows').select(`profile:profiles!follows_followee_id_fkey(${PROFILE_FIELDS})`).eq('follower_id', myId),
    db.from('follows').select(`profile:profiles!follows_follower_id_fkey(${PROFILE_FIELDS})`).eq('followee_id', myId),
  ]);
  if (following.error) throw following.error;
  if (followers.error) throw followers.error;
  const toProfiles = (rows: unknown[] | null) =>
    (rows ?? [])
      .map((r) => (r as { profile: ProfileRow | null }).profile)
      .filter((p): p is ProfileRow => p != null)
      .map(profileFromRow);
  return { following: toProfiles(following.data), followers: toProfiles(followers.data) };
}

export async function follow(userId: string, myId: string) {
  const { error } = await client()
    .from('follows')
    .upsert({ follower_id: myId, followee_id: userId }, { ignoreDuplicates: true });
  if (error) throw error;
}

export async function unfollow(userId: string, myId: string) {
  const { error } = await client()
    .from('follows')
    .delete()
    .eq('follower_id', myId)
    .eq('followee_id', userId);
  if (error) throw error;
}

/** Comparte tus próximos días (libre o trabaja) con tus amigos. */
export async function publishDays(myId: string, days: SharedDay[]) {
  if (days.length === 0) return;
  const now = new Date().toISOString();
  const { error } = await client()
    .from('shared_days')
    .upsert(days.map((d) => ({ user_id: myId, day: d.day, status: d.status, updated_at: now })));
  if (error) throw error;
}

/** Dejar de compartir: se borran todos tus días. */
export async function unpublishDays(myId: string) {
  const { error } = await client().from('shared_days').delete().eq('user_id', myId);
  if (error) throw error;
}

/** De `ids`, quiénes van a ese concierto (por su id canónico). */
export async function fetchWhoGoes(concertId: string, ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await client()
    .from('attendance')
    .select('user_id')
    .eq('concert_id', concertId)
    .in('user_id', ids);
  if (error) throw error;
  return (data ?? []).map((r) => r.user_id as string);
}

/** De `ids` (amigos), quiénes han compartido que ese día están libres. */
export async function fetchWhoIsFree(day: string, ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await client()
    .from('shared_days')
    .select('user_id')
    .eq('day', day)
    .eq('status', 'libre')
    .in('user_id', ids);
  if (error) throw error;
  return (data ?? []).map((r) => r.user_id as string);
}

/** Quién va a un concierto (la "Gente" de su sala), con su perfil. */
export async function fetchRoomMembers(concertId: string): Promise<PublicProfile[]> {
  const { data, error } = await client()
    .from('attendance')
    .select(`profile:profiles(${PROFILE_FIELDS})`)
    .eq('concert_id', concertId)
    .order('created_at')
    .limit(200);
  if (error) throw error;
  return (data ?? [])
    .map((r) => (r as unknown as { profile: ProfileRow | null }).profile)
    .filter((p): p is ProfileRow => p != null)
    .map(profileFromRow);
}
