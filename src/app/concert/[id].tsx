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
import { useApp } from '@/data/app-context';
import { SOURCE_NAMES } from '@/data/sources/types';
import { COLORS } from '@/theme';

type Tab = 'info' | 'lugar' | 'chat';
const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Información' },
  { key: 'lugar', label: 'Lugar' },
  { key: 'chat', label: 'Chat' },
];

export default function ConcertDetail() {
  const insets = useSafeAreaInsets();
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const { concerts, plans, isGoing, toggleGoing, goingCount } = useApp();
  const [tab, setTab] = useState<Tab>(
    TABS.some((t) => t.key === initialTab) ? (initialTab as Tab) : 'info'
  );

  // Los conciertos ya pasados no vienen en la API: solo están en tus planes
  const concert = concerts.find((c) => c.id === id) ?? plans.find((c) => c.id === id);

  if (!concert) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Evento no encontrado</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const going = isGoing(concert.id);
  // El chat es solo para quien va: sin "Voy" no hay pestaña y se vuelve a Información
  const tabs = going ? TABS : TABS.filter((t) => t.key !== 'chat');
  const activeTab: Tab = tabs.some((t) => t.key === tab) ? tab : 'info';
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

  // Ofertas ordenadas de más barata a más cara: la primera es el botón principal
  const [mainOffer, ...otherOffers] = concert.offers;

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
          goingLabel="Voy a este concierto"
          holo
          // Arriba a la izquierda está el botón de volver: la ticketera va a su lado, centrada con él
          sourcePosition={{ top: insets.top + 14, left: 66 }}
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
            <GoButton isGoing={going} onPress={() => toggleGoing(concert)} />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.buy} onPress={() => Linking.openURL(mainOffer.url)}>
              <Text style={styles.buyText} numberOfLines={1}>
                Comprar en {SOURCE_NAMES[mainOffer.source]}
              </Text>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={onShare}>
              <Ionicons name="share-outline" size={24} color={COLORS.text} />
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
                  <Ionicons name="open-outline" size={18} color={COLORS.accent} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.segmented}>
            {tabs.map((t) => (
              <Pressable
                key={t.key}
                style={[styles.segment, activeTab === t.key && styles.segmentActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.segmentText, activeTab === t.key && styles.segmentTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === 'info' && (
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
                  Ticketmaster no da más detalles de este concierto.
                </Text>
              )}
              <ArtistCard eventName={concert.artist} genre={concert.genre} />
            </View>
          )}

          {activeTab === 'lugar' && (
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
                    pinColor={COLORS.accent}
                  />
                </MapView>
              )}
              <Text style={styles.placeName}>{concert.venue}</Text>
              {concert.address ? <Text style={styles.muted}>{concert.address}</Text> : null}

              <View style={styles.mapButtons}>
                <Pressable style={styles.mapButton} onPress={() => Linking.openURL(appleUrl)}>
                  <Ionicons name="navigate" size={16} color={COLORS.accent} />
                  <Text style={styles.mapButtonText}>Apple Maps</Text>
                </Pressable>
                <Pressable style={styles.mapButton} onPress={() => Linking.openURL(googleUrl)}>
                  <Ionicons name="map" size={16} color={COLORS.accent} />
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

          {activeTab === 'chat' && (
            <View style={styles.chatBox}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.lavender} />
              <Text style={styles.chatTitle}>Chat del evento</Text>
              <Text style={styles.muted}>
                Aquí estará el chat abierto de este concierto.
              </Text>
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

const styles = StyleSheet.create({
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
    color: COLORS.accent,
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
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  buy: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: { color: COLORS.white, fontSize: 17, fontWeight: '700', paddingHorizontal: 16 },
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
    width: 54,
    height: 54,
    borderRadius: 27,
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
  infoValue: { color: COLORS.text, fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  paragraph: { color: COLORS.text, fontSize: 16, lineHeight: 24, marginTop: 16 },
  map: { width: '100%', height: 240, borderRadius: 20, marginBottom: 16 },
  placeName: { color: COLORS.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  muted: { color: COLORS.muted, fontSize: 15, marginTop: 4 },
  mapButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mapButtonText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 28 },
  seatmap: { width: '100%', height: 280, marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 16 },
  chatBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 6,
  },
  chatTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
});