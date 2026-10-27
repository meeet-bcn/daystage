import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/theme';

// Geometría en unidades del lado de la hoja (la misma que
// scripts/generate-brand-assets.swift): hoja de calendario violeta con dos
// anillas y, dentro, el haz de un foco que ilumina el escenario.
const RADIUS = 0.22;
const RING_W = 0.09;
const RING_H = 0.2;
const RING_TOP = -0.08;
const RINGS_X = [0.32, 0.68];
const BEAM_TOP = 0.3;
const BEAM_BOTTOM = 0.74;
const BEAM_TOP_W = 0.12;
const BEAM_BOTTOM_W = 0.52;
const STAGE_W = 0.56;
const STAGE_H = 0.13;

/** Alto total / lado de la hoja (las anillas asoman por arriba). */
export const MARK_HEIGHT = 1 - RING_TOP;

/** Imagotipo de DayStage: un calendario con un foco de escenario. `size` = lado de la hoja. */
export function DayStageMark({ size }: { size: number }) {
  const u = size;
  const beamH = (BEAM_BOTTOM - BEAM_TOP) * u;
  const side = ((BEAM_BOTTOM_W - BEAM_TOP_W) / 2) * u;
  return (
    <View
      style={{ width: u, height: u * (1 - RING_TOP) }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[styles.sheet, { top: -RING_TOP * u, width: u, height: u, borderRadius: RADIUS * u }]}
      >
        {/* El haz: un trapecio (bordes transparentes a los lados) y el círculo de luz en el suelo */}
        <View
          style={[
            styles.beam,
            {
              left: (0.5 - BEAM_BOTTOM_W / 2) * u,
              top: BEAM_TOP * u,
              width: BEAM_BOTTOM_W * u,
              borderBottomWidth: beamH,
              borderLeftWidth: side,
              borderRightWidth: side,
            },
          ]}
        />
        <View
          style={[
            styles.stage,
            {
              left: (0.5 - STAGE_W / 2) * u,
              top: (BEAM_BOTTOM - STAGE_H / 2) * u,
              width: STAGE_W * u,
              height: STAGE_H * u,
              borderRadius: (STAGE_H * u) / 2,
            },
          ]}
        />
      </View>
      {RINGS_X.map((x) => (
        <View
          key={x}
          style={[
            styles.ring,
            {
              left: (x - RING_W / 2) * u,
              width: RING_W * u,
              height: RING_H * u,
              borderRadius: (RING_W * u) / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Logotipo: el imagotipo y «daystage.» (minúsculas, tinta, punto violeta). */
export function DayStageLogo({ size = 28 }: { size?: number }) {
  return (
    <View style={styles.logo} accessibilityRole="header" accessibilityLabel="DayStage">
      <DayStageMark size={size * 1.05} />
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.2, letterSpacing: -size * 0.03 }]}>
        daystage<Text style={styles.dot}>.</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, backgroundColor: COLORS.accent, overflow: 'hidden' },
  beam: {
    position: 'absolute',
    height: 0,
    borderBottomColor: 'rgba(255,255,255,0.9)',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  stage: { position: 'absolute', backgroundColor: COLORS.white },
  ring: { position: 'absolute', top: 0, backgroundColor: COLORS.text },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { color: COLORS.text, fontWeight: '800' },
  dot: { color: COLORS.accent },
});
