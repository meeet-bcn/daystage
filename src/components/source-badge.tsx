import { StyleSheet, Text, View } from 'react-native';

import type { TicketOffer } from '@/data/concerts';
import { SOURCE_NAMES } from '@/data/sources/types';
import { COLORS } from '@/theme';

/** Dónde se venden las entradas: la ticketera principal y cuántas más hay. */
export function SourceBadge({ offers }: { offers: TicketOffer[] }) {
  const [main, ...others] = offers;
  if (!main) return null;

  return (
    <View
      style={styles.badge}
      accessibilityLabel={`A la venta en ${offers.map((o) => SOURCE_NAMES[o.source]).join(', ')}`}
    >
      <Text style={styles.name}>{SOURCE_NAMES[main.source]}</Text>
      {others.length > 0 && <Text style={styles.more}>+{others.length}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
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
  more: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
});
