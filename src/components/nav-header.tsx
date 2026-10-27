import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/theme';

type Props = {
  title: string;
  /** Botón a la derecha (p. ej. "Guardar"). */
  right?: ReactNode;
  /** En un modal, "Cancelar" en vez de la flecha. */
  modal?: boolean;
};

/** Cabecera de las pantallas que se abren encima de las pestañas, como la de Ajustes. */
export function NavHeader({ title, right, modal = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: modal ? 14 : insets.top + 8 }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={styles.side}
        accessibilityLabel={modal ? 'Cancelar' : 'Volver'}
      >
        {modal ? (
          <Text style={styles.cancel}>Cancelar</Text>
        ) : (
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        )}
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  side: { minWidth: 80, height: 40, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 17, fontWeight: '700' },
  cancel: { color: COLORS.text, fontSize: 16 },
});
