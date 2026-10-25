import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArtistCard } from '@/components/artist-card';
import { EventImage } from '@/components/event-image';
import { GoButton } from '@/components/go-button';
import { MediaViewer } from '@/components/media-viewer';
import { SongCard } from '@/components/song-card';
import { WishButton } from '@/components/wish-button';
import { useApp } from '@/data/app-context';
import { buyOffer } from '@/data/offers';
import { useArtistArtwork } from '@/hooks/use-artist-artwork';
import { useTopSong } from '@/hooks/use-top-song';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// Como las columnas del perfil: icono y, debajo, el nombre, con la raya del tema
type Tab = 'info' | 'lugar';
const TABS: {
  key: Tab;
  label: string;
  icon: 'information-circle-outline' | 'map-outline';
  activeIcon: 'information-circle' | 'map';
}[] = [
  {
    key: 'info',
    label: 'Información',
    icon: 'information-circle-outline',
    activeIcon: 'information-circle',
  },
  { key: 'lugar', label: 'Lugar', icon: 'map-outline', activeIcon: 'map' },
];

export default function ConcertDetail() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concerts, plans, isGoing, toggleGoing, goingCount } = useApp();
  const [tab, setTab] = useState<Tab>('info');

  // Los conciertos ya pasados no vienen en la API: solo están en tus planes
  const concert = concerts.find((c) => c.id === id) ?? plans.find((c) => c.id === id);
  const { song: topSong } = useTopSong(concert?.artist ?? '');
  const [viewing, setViewing] = useState(false);
  const ownPhoto = concert ? concert.hero || concert.image : '';
  const artistPhoto = useArtistArtwork(concert?.artist ?? '', !ownPhoto);
  const photoUri = ownPhoto || artistPhoto;

  if (!concert) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Evento no encontrado</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const going = isGoing(concert.id);
  const count = goingCount(concert);
  const hasCoords = concert.latitude != null && concert.longitude != null;
  const place = hasCoords
    ? `${concert.latitude},${concert.longitude}`
    : encodeURIComponent(`${concert.venue} ${concert.address}`);
  const appleUrl = hasCoords
    ? `http://maps.apple.com/?daddr=${place}&q=${encodeURIComponent(concert.venue)}`
    : `http://maps.apple.com/?q=${place}`;
  const googleUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${place}`
    : `https://www.google.com/maps/search/?api=1&query=${place}`;

  // Un solo enlace de compra (Ticketmaster si está) y sin decir de qué fuente
  // viene: al usuario no le hace falta saberlo
  const mainOffer = buyOffer(concert.offers);
  const free = concert.priceMin === 0;
  const buyLabel = free ? 'Entrada gratuita' : 'Comprar entradas';
  const openChat = () => router.push({ pathname: '/chat/[id]', params: { id: concert.id } });

  const onShare = async () => {
    const text = going
      ? `¡Voy a ${concert.artist}! ${concert.date} · ${concert.venue}. ¿Te vienes?`
      : `Mira este concierto: ${concert.artist} · ${concert.date} · ${concert.venue}`;
    await Share.share({
      message: Platform.OS === 'ios' ? text : `${text}\n${mainOffer.url}`,
      url: mainOffer.url,
    });
  };

  const infoRows = [
    { label: 'Fecha', value: concert.date },
    { label: 'Puertas', value: concert.doors },
    { label: 'Recinto', value: concert.venue },
    { label: 'Telonero', value: concert.support },
    { label: 'Edad', value: concert.ages },
    { label: 'Precio', value: concert.price },
    { label: 'Género', value: concert.genre },
    { label: 'Estado', value: concert.status },
  ].filter((r) => r.value);

  return (
    <View style={styles.container}>
      <ScrollView
        // La foto debe llegar hasta arriba: sin esto iOS añade el margen de la zona segura
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 56 }}
      >
        <EventImage
          concert={concert}
          going={going}
          holo
          // Tocar la foto la abre en grande (si hay foto: la del concierto o la del artista)
          onPressImage={photoUri ? () => setViewing(true) : undefined}
        />

        <View style={styles.body}>
          <Text style={styles.date}>{concert.date}</Text>
          <Text style={styles.artist}>{concert.artist}</Text>
          <Text style={styles.venue}>{concert.venue}</Text>

          <View style={styles.goingRow}>
            <Text style={styles.going}>
              {count === 0
                ? 'Sé el primero en apuntarte'
                : `${count} ${count === 1 ? 'persona va' : 'personas van'}`}
            </Text>
            <View style={styles.goingActions}>
              <WishButton concert={concert} />
              <GoButton isGoing={going} onPress={() => toggleGoing(concert)} />
            </View>
          </View>

          <View style={styles.actions}>
            {mainOffer.url ? (
              <Pressable style={styles.buy} onPress={() => Linking.openURL(mainOffer.url)}>
                <Ionicons
                  name={free ? 'ticket-outline' : 'cart-outline'}
                  size={18}
                  color={COLORS.white}
                />
                <Text style={styles.buyText} numberOfLines={1}>
                  {buyLabel}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.buy, styles.buyNone]}>
                <Text style={styles.buyNoneText} numberOfLines={1}>
                  {free ? 'Entrada gratuita' : 'Entradas en la sala'}
                </Text>
              </View>
            )}
            <Pressable style={styles.shareBtn} onPress={onShare}>
              <Ionicons name="share-outline" size={21} color={COLORS.text} />
            </Pressable>
          </View>

          {/* Si vas, la sala del concierto está a un toque */}
          {going && (
            <Pressable
              style={styles.chatBtn}
              onPress={openChat}
              accessibilityRole="button"
              accessibilityLabel="Ir a la sala de chat"
            >
              <Ionicons name="chatbubbles-outline" size={19} color={theme.accent} />
              <Text style={styles.chatBtnText}>Ir a la sala de chat</Text>
            </Pressable>
          )}

          {topSong ? <SongCard song={topSong} title="Escucha a este artista" /> : null}

          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={active ? t.activeIcon : t.icon}
                    size={24}
                    color={active ? theme.accent : COLORS.muted}
                  />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'info' && (
            <View>
              {infoRows.map((row, i) => (
                <View key={row.label} style={[styles.infoRow, i > 0 && styles.infoRowLine]}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
              <Text style={styles.paragraph}>
                {concert.info || 'No hay más detalles de este concierto.'}
              </Text>
              <ArtistCard eventName={concert.artist} genre={concert.genre} />
            </View>
          )}

          {tab === 'lugar' && (
            <View>
              {hasCoords && (
                <MapView
                  style={styles.map}
                  scrollEnabled={false}
                  initialRegion={{
                    latitude: concert.latitude as number,
                    longitude: concert.longitude as number,
                    latitudeDelta: 0.012,
                    longitudeDelta: 0.012,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: concert.latitude as number,
                      longitude: concert.longitude as number,
                    }}
                    title={concert.venue}
                    pinColor={theme.accent}
                  />
                </MapView>
              )}
              <Text style={styles.placeName}>{concert.venue}</Text>
              {concert.address ? <Text style={styles.muted}>{concert.address}</Text> : null}

              <View style={styles.mapButtons}>
                <Pressable style={styles.mapButton} onPress={() => Linking.openURL(appleUrl)}>
                  <Ionicons name="navigate" size={16} color={theme.accent} />
                  <Text style={styles.mapButtonText}>Apple Maps</Text>
                </Pressable>
                <Pressable style={styles.mapButton} onPress={() => Linking.openURL(googleUrl)}>
                  <Ionicons name="map" size={16} color={theme.accent} />
                  <Text style={styles.mapButtonText}>Google Maps</Text>
                </Pressable>
              </View>

              {concert.seatmap ? (
                <View>
                  <Text style={styles.sectionTitle}>Plano del recinto</Text>
                  <Image
                    source={{ uri: concert.seatmap }}
                    style={styles.seatmap}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <MediaViewer
        media={viewing && photoUri ? { uri: photoUri, kind: 'photo' } : null}
        onClose={() => setViewing(false)}
      />

      <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    back: {
      position: 'absolute',
      left: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { padding: 20 },
    date: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    artist: {
      color: COLORS.text,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginTop: 6,
    },
    venue: { color: COLORS.muted, fontSize: 18, marginTop: 4 },
    goingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    going: { color: COLORS.muted, fontSize: 15, flexShrink: 1, marginRight: 12 },
    goingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    buy: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      height: 46,
      borderRadius: 23,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buyNone: { backgroundColor: COLORS.surface },
    buyNoneText: { color: COLORS.text, fontSize: 15, fontWeight: '700', paddingHorizontal: 16 },
    buyText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    chatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 46,
      borderRadius: 23,
      marginTop: 12,
      backgroundColor: theme.accentSoft,
    },
    chatBtnText: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    shareBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: COLORS.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // A todo lo ancho (sin el margen del cuerpo), como en el perfil
    tabs: {
      flexDirection: 'row',
      marginTop: 24,
      marginBottom: 20,
      marginHorizontal: -20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingTop: 12,
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: theme.accent },
    tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    tabTextActive: { color: theme.accent, fontWeight: '700' },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 14,
      gap: 16,
    },
    infoRowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
    infoLabel: { color: COLORS.muted, fontSize: 15 },
    infoValue: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'right',
    },
    paragraph: { color: COLORS.text, fontSize: 16, lineHeight: 24, marginTop: 16 },
    map: { width: '100%', height: 240, borderRadius: 20, marginBottom: 16 },
    placeName: { color: COLORS.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
    muted: { color: COLORS.muted, fontSize: 15, marginTop: 4 },
    mapButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
    mapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.accentSoft,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    mapButtonText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 28 },
    seatmap: {
      width: '100%',
      height: 280,
      marginTop: 12,
      backgroundColor: COLORS.surface,
      borderRadius: 16,
    },
  });
