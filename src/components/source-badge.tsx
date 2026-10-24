import { StyleSheet, Text, View } from 'react-native';

import type { TicketOffer } from '@/data/concerts';
import { sortedOffers } from '@/data/offers';
import { SOURCE_NAMES } from '@/data/sources/types';
import { COLORS } from '@/theme';

/** De dónde sale el concierto: una pastilla por fuente (Ticketmaster, Agenda BCN…). */
export function SourceBadge({ offers }: { offers: TicketOffer[] }) {
  const sources = sortedOffers(offers);
  if (sources.length === 0) return null;

  return (
    <View
      style={styles.row}
      accessibilityLabel={`En ${sources.map((o) => SOURCE_NAMES[o.source]).join(' y ')}`}
    >
      {sources.map((o) => (
        <View key={o.source} style={styles.badge}>
          <Text style={styles.name}>{SOURCE_NAMES[o.source]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  name: { color: COLORS.text, fontSize: 12, fontWeight: '800', letterSpacing: -0.1 },
});
