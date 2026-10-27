import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { loadJSON, saveJSON } from '@/data/storage';
import { COLORS } from '@/theme';

// Qué secciones están abiertas, por clave (se recuerda entre aperturas de la app)
const KEY = 'daystage.sections.v1';

type Props = {
  /** Para recordar si está abierta. */
  id: string;
  title: string;
  defaultOpen?: boolean;
  /** Botones a la derecha de la cabecera (p. ej. «Editar»). */
  actions?: ReactNode;
  children: ReactNode;
};

/** Sección con cabecera tocable y flecha: se pliega y se despliega. */
export function CollapsibleSection({ id, title, defaultOpen = true, actions, children }: Props) {
  const [open, setOpen] = useState(() => loadJSON<Record<string, boolean>>(KEY, {})[id] ?? defaultOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !open;
    setOpen(next);
    saveJSON(KEY, { ...loadJSON<Record<string, boolean>>(KEY, {}), [id]: next });
  };
  return (
    <View>
      <View style={styles.header}>
        <Pressable
          style={styles.toggle}
          onPress={toggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          hitSlop={6}
        >
          <Text style={styles.title}>{title}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.muted} />
        </Pressable>
        {open && actions}
      </View>
      {open && children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 8,
    marginHorizontal: 24,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  title: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
