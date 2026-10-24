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
import { SongCard } from '@/components/song-card';
import { WishButton } from '@/components/wish-button';
import { useApp } from '@/data/app-context';
import { buyOffer, otherTicketOffers } from '@/data/offers';
import { SOURCE_NAMES } from '@/data/sources/types';
import { useTopSong } from '@/hooks/use-top-song';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

// El chat de cada concierto no va aquí: solo se abre desde la pestaña Meeet in
type Tab = 'info' | 'lugar';
const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Información' },
  { key: 'lugar', label: 'Lugar' },
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
  const topSong = useTopSong(concert?.artist ?? '');

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

  // Un solo enlace de compra: Ticketmaster si está; la agenda BCN, solo si no hay otro
  const mainOffer = buyOffer(concert.offers);
  const otherOffers = otherTicketOffers(concert.offers);
  // La agenda del Ayuntamiento no vende: enlaza a la web del concierto (o no trae)
  const fromAgenda = concert.offers.some((o) => o.source === 'bcn');
  const buyLabel =
    mainOffer.source === 'bcn'
      ? concert.priceMin === 0
        ? 'Entrada libre · Más información'
        : 'Entradas en la web oficial'
      : `Comprar en ${SOURCE_NAMES[mainOffer.source]}`;

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
          // La ticketera ya sale en el botón de comprar
          showSource={false}
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
                <Text style={styles.buyText} numberOfLines={1}>
                  {buyLabel}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.buy, styles.buyNone]}>
                <Text style={styles.buyNoneText} numberOfLines={1}>
                  {concert.priceMin === 0 ? 'Entrada libre' : 'Entradas en la sala'}
                </Text>
              </View>
            )}
            <Pressable style={styles.shareBtn} onPress={onShare}>
              <Ionicons name="share-outline" size={21} color={COLORS.text} />
            </Pressable>
          </View>

          {otherOffers.length > 0 && (
            <View style={styles.offers}>
              <Text style={styles.offersTitle}>También a la venta en</Text>
              {otherOffers.map((offer) => (
                <Pressable
                  key={offer.source}
                  style={styles.offerRow}
                  onPress={() => Linking.openURL(offer.url)}
                >
                  <Text style={styles.offerName}>{SOURCE_NAMES[offer.source]}</Text>
                  {offer.price ? <Text style={styles.offerPrice}>{offer.price}</Text> : null}
                  <Ionicons name="open-outline" size={18} color={theme.accent} />
                </Pressable>
              ))}
            </View>
          )}

          {topSong ? <SongCard song={topSong} title="Escucha a este artista" /> : null}

          <View style={styles.segmented}>
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                style={[styles.segment, tab === t.key && styles.segmentActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.segmentText, tab === t.key && styles.segmentTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === 'info' && (
            <View>
              {infoRows.map((row, i) => (
                <View key={row.label} style={[styles.infoRow, i > 0 && styles.infoRowLine]}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
              {concert.info ? (
                <Text style={styles.paragraph}>{concert.info}</Text>
              ) : (
                <Text style={styles.paragraph}>
                  {fromAgenda ? 'La agenda' : 'Ticketmaster'} no da más detalles de este concierto.
                </Text>
              )}
              {/* La licencia (CC BY 4.0) pide citar la fuente */}
              {fromAgenda && (
                <Text style={styles.credit}>
                  Fuente: Agenda Cultural del Ajuntament de Barcelona (Open Data BCN)
                </Text>
              )}
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
      height: 46,
      borderRadius: 23,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buyNone: { backgroundColor: COLORS.surface },
    buyNoneText: { color: COLORS.text, fontSize: 15, fontWeight: '700', paddingHorizontal: 16 },
    credit: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
    buyText: { color: COLORS.white, fontSize: 15, fontWeight: '700', paddingHorizontal: 16 },
    offers: { marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 20, padding: 16 },
    offersTitle: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    offerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    offerName: { flex: 1, color: COLORS.text, fontSize: 16, fontWeight: '600' },
    offerPrice: { color: COLORS.muted, fontSize: 15 },
    shareBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: COLORS.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: 14,
      padding: 4,
      marginTop: 28,
      marginBottom: 20,
    },
    segment: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
    segmentActive: {
      backgroundColor: COLORS.white,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    segmentText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    segmentTextActive: { color: COLORS.text },
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
