import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BRAND_GRADIENT, COLORS } from '@/theme';

// El imagotipo es una imagen: lo dibuja scripts/generate-brand-assets.swift
// (hoja de calendario con el degradado de escenario, dos anillas y el glifo ♪
// de Noto Music), igual que el icono y el splash.
const MARK = require('@/assets/images/brand-mark.png');
const RING_TOP = -0.08;

/** Alto total / lado de la hoja (las anillas asoman por arriba). */
export const MARK_HEIGHT = 1 - RING_TOP;

/** Imagotipo de DayStage: un calendario con una corchea. `size` = lado de la hoja. */
export function DayStageMark({ size }: { size: number }) {
  return (
    <Image
      source={MARK}
      style={{ width: size, height: size * MARK_HEIGHT }}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Logotipo: el imagotipo y «daystage» en tinta, con el punto en el degradado de la marca. */
export function DayStageLogo({ size = 28 }: { size?: number }) {
  const dot = size * 0.2;
  return (
    <View style={styles.logo} accessibilityRole="header" accessibilityLabel="DayStage">
      <DayStageMark size={size * 1.05} />
      <View style={styles.word}>
        <Text style={[styles.text, { fontSize: size, lineHeight: size * 1.2, letterSpacing: -size * 0.03 }]}>
          daystage
        </Text>
        <View
          style={[
            styles.dot,
            { width: dot, height: dot, borderRadius: dot / 2, marginLeft: size * 0.04, marginBottom: size * 0.22 },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { flexDirection: 'row', alignItems: 'flex-end' },
  text: { color: COLORS.text, fontWeight: '800' },
  dot: { backgroundColor: COLORS.stageMagenta, experimental_backgroundImage: BRAND_GRADIENT },
});
