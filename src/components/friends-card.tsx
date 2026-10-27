import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import type { Concert } from '@/data/concerts';
import { canonicalConcertId } from '@/data/merge';
import { useSession } from '@/data/session-context';
import { friendsLabel, type PublicProfile } from '@/data/social';
import { useSocial } from '@/data/social-context';
import { fetchWhoGoes, fetchWhoIsFree } from '@/data/social-service';
import { toDateKey } from '@/data/shifts';
import { COLORS } from '@/theme';

/**
 * En la ficha: quién de la gente que sigues va, y cuáles de tus amigos (os
 * seguís los dos y comparten sus días) están libres ese día. Sin nadie, nada.
 */
export function FriendsCard({ concert }: { concert: Concert }) {
  const { userId } = useSession();
  const { following, friendIds } = useSocial();
  const [going, setGoing] = useState<PublicProfile[]>([]);
  const [free, setFree] = useState<PublicProfile[]>([]);

  const followingKey = following.map((p) => p.id).join(',');
  const friendsKey = friendIds.join(',');
  useEffect(() => {
    if (!userId || concert.startsAt == null || following.length === 0) return;
    let alive = true;
    const byId = new Map(following.map((p) => [p.id, p]));
    const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((p): p is PublicProfile => !!p);
    Promise.all([
      fetchWhoGoes(canonicalConcertId(concert), [...byId.keys()]),
      fetchWhoIsFree(toDateKey(new Date(concert.startsAt)), friendIds),
    ])
      .then(([goingIds, freeIds]) => {
        if (!alive) return;
        setGoing(pick(goingIds));
        setFree(pick(freeIds.filter((id) => !goingIds.includes(id))));
      })
      .catch((e) => console.warn('[social] Amigos del concierto:', e));
    return () => {
      alive = false;
    };
    // Las listas se comparan por sus ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, concert.id, concert.startsAt, followingKey, friendsKey]);

  if (!userId || (going.length === 0 && free.length === 0)) return null;

  const row = (people: PublicProfile[], label: string) => (
    <View style={styles.row}>
      <View style={styles.faces}>
        {people.slice(0, 4).map((p, i) => (
          <View key={p.id} style={[styles.face, i > 0 && styles.overlap]}>
            <ProfileAvatar size={30} uri={p.photo ?? undefined} />
          </View>
        ))}
      </View>
      <Text style={styles.text} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tus amigos</Text>
      {going.length > 0 && row(going, friendsLabel(going, 'van'))}
      {free.length > 0 && row(free, `${friendsLabel(free, 'libres')} ese día`)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: COLORS.mist, gap: 12 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faces: { flexDirection: 'row' },
  face: { borderRadius: 17, borderWidth: 2, borderColor: COLORS.mist },
  overlap: { marginLeft: -10 },
  text: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '600' },
});
