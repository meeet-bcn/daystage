import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { COLORS } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchBar({ value, onChangeText, placeholder = 'Buscar', autoFocus = false }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={COLORS.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        style={styles.input}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        autoFocus={autoFocus}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Borrar búsqueda">
          <Ionicons name="close-circle" size={18} color={COLORS.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
  },
  input: { flex: 1, height: '100%', color: COLORS.text, fontSize: 16 },
});
