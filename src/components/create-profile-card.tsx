import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ImagotipoAnimado } from '@/components/imagotipo';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/** Lo que ganas creándote el perfil (bienvenida y Perfil). */
export const PROFILE_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'chatbubbles-outline', text: 'Chatea con la gente que va a tus conciertos' },
  { icon: 'language-outline', text: 'Conoce a gente que habla tu idioma' },
  { icon: 'heart-outline', text: 'Guarda conciertos en tu lista de deseos' },
  { icon: 'color-palette-outline', text: 'Tu perfil con foto, fondo, canción y redes' },
];

/** Una ventaja, con su icono en el acento del tema. */
export function BenefitRow({ icon, text }: (typeof PROFILE_BENEFITS)[number]) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}>
        <Ionicons name={icon} size={18} style={styles.benefitIconColor} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

/** Perfil sin crear (se omitió en la bienvenida): qué ganas y el botón para crearlo. */
export function CreateProfileCard() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      <ImagotipoAnimado height={64} />
      <Text style={styles.title}>Crea tu perfil</Text>
      <Text style={styles.text}>Es un momento y te abre lo mejor de meeet:</Text>
      <View style={styles.benefits}>
        {PROFILE_BENEFITS.map((b) => (
          <BenefitRow key={b.text} {...b} />
        ))}
      </View>
      <Pressable style={styles.button} onPress={() => router.push('/onboarding')}>
        <Text style={styles.buttonText}>Crear mi perfil</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginTop: 12,
      padding: 22,
      borderRadius: 24,
      alignItems: 'center',
      backgroundColor: COLORS.mist,
    },
    title: {
      color: COLORS.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginTop: 14,
    },
    text: { color: COLORS.muted, fontSize: 15, marginTop: 6, textAlign: 'center' },
    benefits: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
    benefit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.8)',
    },
    benefitIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accentSoft,
    },
    benefitIconColor: { color: theme.accent },
    benefitText: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '600' },
    button: {
      alignSelf: 'stretch',
      height: 50,
      borderRadius: 25,
      marginTop: 20,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  });
