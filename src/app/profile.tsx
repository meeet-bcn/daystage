import { StyleSheet, Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/profile-avatar';
import { COLORS } from '@/theme';

// De momento solo es el hueco del perfil: foto, gustos y ajustes llegarán más adelante
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ProfileAvatar size={96} />
      <Text style={styles.title}>Tu perfil</Text>
      <Text style={styles.text}>
        Muy pronto podrás añadir tu foto y contarnos qué música te gusta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 20,
  },
  text: { color: COLORS.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
});
