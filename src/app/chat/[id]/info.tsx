import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcertImage } from '@/components/concert-image';
import { Media, MediaViewer } from '@/components/media-viewer';
import { ProfileAvatar } from '@/components/profile-avatar';
import { PersonRow } from '@/components/person-row';
import { VideoThumb } from '@/components/video-thumb';
import { useApp } from '@/data/app-context';
import { blockUser, reportUser } from '@/data/chat-service';
import { canonicalConcertId } from '@/data/merge';
import { useSession } from '@/data/session-context';
import { displayName, type PublicProfile } from '@/data/social';
import { fetchRoomMembers } from '@/data/social-service';
import { useChatRoom } from '@/hooks/use-chat-room';
import { membersLabel } from '@/data/chat';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { useSetlists } from '@/hooks/use-setlists';
import { COLORS, Theme } from '@/theme';

type Tab = 'people' | 'photos' | 'videos' | 'setlist';
const TABS: { key: Tab; label: string }[] = [
  { key: 'people', label: 'Gente' },
  { key: 'photos', label: 'Fotos' },
  { key: 'videos', label: 'Vídeos' },
  { key: 'setlist', label: 'Setlist' },
];
const GRID = 3;
const GAP = 2;

const dateOf = (isoDay: string) =>
  new Date(`${isoDay}T12:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/**
 * Información de la sala, como la de un grupo de Telegram o WhatsApp:
 * la gente que va, las fotos y los vídeos de la sala (se abren a pantalla
 * completa) y los setlists de sus conciertos anteriores.
 */
export default function ChatInfoScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concerts, plans, profile, goingCount, messagesOfConcert } = useApp();
  const [tab, setTab] = useState<Tab>('people');
  const [open, setOpen] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Media | null>(null);

  const concert = concerts.find((c) => c.id === id) ?? plans.find((c) => c.id === id);
  const artist = concert?.artist ?? '';
  // Con cuenta, las fotos y vídeos de la sala del servidor; sin backend, los de este móvil
  const room = useChatRoom(id, concert, { live: false });
  // Con cuenta, la gente que va de verdad (attendance); sin ella, solo tú
  const { userId } = useSession();
  const [people, setPeople] = useState<PublicProfile[] | null>(null);
  useEffect(() => {
    if (!userId || !concert) return;
    let alive = true;
    fetchRoomMembers(canonicalConcertId(concert))
      .then((list) => alive && setPeople(list))
      .catch((e) => console.warn('[sala] Gente:', e));
    return () => {
      alive = false;
    };
    // Solo al abrir (el concierto cambia de objeto con cada página cargada)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id]);

  const moderate = (person: PublicProfile) =>
    Alert.alert(displayName(person), undefined, [
      {
        text: 'Denunciar',
        onPress: () =>
          reportUser(person.id, userId!)
            .then(() => Alert.alert('Gracias. Lo revisaremos.'))
            .catch(() => Alert.alert('No se pudo enviar', 'Inténtalo otra vez.')),
      },
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: () =>
          blockUser(person.id, userId!)
            .then(() => {
              setPeople((list) => list?.filter((p) => p.id !== person.id) ?? null);
              Alert.alert('Bloqueada', 'Ya no verás sus mensajes.');
            })
            .catch(() => Alert.alert('No se pudo bloquear', 'Inténtalo otra vez.')),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  const sent = room.mode === 'remote' ? room.messages : messagesOfConcert(id);
  const photos = sent.filter((m) => m.photo);
  const videos = sent.filter((m) => m.video);
  const members = concert ? Math.max(1, goingCount(concert)) : 1;
  const others = members - 1;
  const { available, loading, setlists, error } = useSetlists(artist);
  const tile = (width - GAP * (GRID - 1)) / GRID;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={26} color={theme.accent} />
        </Pressable>
        <Text style={styles.topTitle}>Información</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.hero}>
          {concert ? (
            <ConcertImage concert={concert} style={styles.avatar} iconSize={32} />
          ) : (
            <View style={styles.avatar} />
          )}
          <Text style={styles.name}>{artist}</Text>
          <Text style={styles.meta}>
            {membersLabel(members)}
            {concert ? ` · ${concert.date}` : ''}
          </Text>
          {concert ? <Text style={styles.venue}>{concert.venue}</Text> : null}
          {concert ? (
            <Pressable
              style={styles.link}
              onPress={() => router.push({ pathname: '/concert/[id]', params: { id: concert.id } })}
            >
              <Ionicons name="musical-notes-outline" size={18} color={theme.accent} />
              <Text style={styles.linkText}>Ver la ficha del concierto</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.key }}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'people' && people && (
          <View style={styles.members}>
            {people.map((person) =>
              person.id === userId ? (
                <PersonRow key={person.id} person={person} hideFollow detail="Tú" />
              ) : (
                <PersonRow
                  key={person.id}
                  person={person}
                  onLongPress={() => moderate(person)}
                  accessory={
                    <Pressable
                      onPress={() => moderate(person)}
                      hitSlop={10}
                      accessibilityLabel={`Más opciones de ${displayName(person)}`}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.muted} />
                    </Pressable>
                  }
                />
              )
            )}
            {people.length === 0 && (
              <Text style={styles.note}>Cuando la gente le dé a «Meeet In!», la verás aquí.</Text>
            )}
          </View>
        )}

        {tab === 'people' && !people && (
          <View>
            <View style={styles.member}>
              <ProfileAvatar size={44} uri={profile.photo || undefined} />
              <View style={styles.memberText}>
                <Text style={styles.memberName}>
                  {profile.name || `@${profile.nick}`} <Text style={styles.you}>(tú)</Text>
                </Text>
                <Text style={styles.memberSub}>@{profile.nick}</Text>
              </View>
            </View>
            <Text style={styles.note}>
              {others > 0
                ? `${others} ${others === 1 ? 'persona más va' : 'personas más van'} a este concierto.`
                : 'Cuando más gente le dé a «Meeet In!» a este concierto, la verás aquí.'}{' '}
              De momento solo se te ve a ti: aún no hay cuentas de otras personas.
            </Text>
          </View>
        )}

        {tab === 'photos' &&
          (photos.length > 0 ? (
            <View style={styles.grid}>
              {photos.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setViewing({ uri: m.photo!, kind: 'photo' })}
                  accessibilityRole="imagebutton"
                  accessibilityLabel="Ver foto"
                >
                  <Image
                    source={{ uri: m.photo }}
                    style={{ width: tile, height: tile }}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>
              Las fotos que se envíen a la sala aparecerán aquí. Envía la primera con el clip o la cámara.
            </Text>
          ))}

        {tab === 'videos' &&
          (videos.length > 0 ? (
            <View style={styles.grid}>
              {videos.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setViewing({ uri: m.video!, kind: 'video' })}
                  accessibilityRole="button"
                  accessibilityLabel="Ver vídeo"
                >
                  <VideoThumb uri={m.video!} style={{ width: tile, height: tile }} playSize={36} />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>
              Los vídeos que se envíen a la sala aparecerán aquí. Envía el primero con el clip o la
              cámara.
            </Text>
          ))}

        {tab === 'setlist' && (
          <View>
            {!available ? (
              <Text style={styles.empty}>
                Aquí verás qué tocó {artist} en sus últimos conciertos (setlist.fm). Falta
                configurar la clave de setlist.fm en la app.
              </Text>
            ) : loading ? (
              <ActivityIndicator color={theme.accent} style={{ marginTop: 32 }} />
            ) : error ? (
              <Text style={styles.empty}>
                No se han podido cargar los setlists. Prueba más tarde.
              </Text>
            ) : setlists.length === 0 ? (
              <Text style={styles.empty}>
                setlist.fm no tiene setlists de {artist}. Si vas, ¡compártelo en la sala!
              </Text>
            ) : (
              <>
                <Text style={styles.note}>Lo que tocó en sus últimos conciertos:</Text>
                {setlists.map((s) => {
                  const expanded = open === s.id;
                  return (
                    <View key={s.id} style={styles.setlist}>
                      <Pressable
                        style={styles.setlistHead}
                        onPress={() => setOpen(expanded ? null : s.id)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded }}
                      >
                        <View style={styles.memberText}>
                          <Text style={styles.setlistTitle}>
                            {dateOf(s.date)} · {s.venue}
                          </Text>
                          <Text style={styles.memberSub}>
                            {[s.city, s.tour].filter(Boolean).join(' · ')} · {s.songs.length}{' '}
                            canciones
                          </Text>
                        </View>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={COLORS.muted}
                        />
                      </Pressable>
                      {expanded && (
                        <View style={styles.songs}>
                          {s.songs.map((song, i) => (
                            <Text key={`${song}-${i}`} style={styles.song}>
                              <Text style={styles.songNumber}>{i + 1}. </Text>
                              {song}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
                <Text style={styles.credit}>Setlists de setlist.fm</Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
      <MediaViewer media={viewing} onClose={() => setViewing(null)} />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    topTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
    hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.surface },
    name: {
      color: COLORS.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
      marginTop: 12,
    },
    meta: { color: COLORS.muted, fontSize: 15, marginTop: 4 },
    venue: { color: COLORS.muted, fontSize: 15, marginTop: 2 },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 14,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accentSoft,
    },
    linkText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
      marginBottom: GAP,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: theme.accent },
    tabText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    tabTextActive: { color: theme.accent, fontWeight: '700' },
    member: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    memberText: { flex: 1 },
    memberName: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
    you: { color: COLORS.muted, fontWeight: '400' },
    memberSub: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
    members: { paddingHorizontal: 20, paddingTop: 8 },
    note: {
      color: COLORS.muted,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 16,
      marginTop: 4,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    empty: {
      color: COLORS.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      paddingHorizontal: 32,
      paddingTop: 32,
    },
    setlist: {
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      overflow: 'hidden',
    },
    setlistHead: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
    setlistTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
    songs: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
    song: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
    songNumber: { color: COLORS.muted },
    credit: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 18 },
  });
