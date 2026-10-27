import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { NavHeader } from '@/components/nav-header';
import { useSession } from '@/data/session-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Crear cuenta o entrar con un código de 6 cifras por email (Supabase OTP).
 * Apple y Google llegarán después. Modal desde el chat o desde Ajustes.
 */
export default function SignInScreen() {
  const styles = useThemedStyles(makeStyles);
  const { enabled, sendCode, verifyCode } = useSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo ha fallado. Inténtalo otra vez.');
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = () =>
    run(async () => {
      await sendCode(email);
      setStep('code');
    });

  const submitCode = () =>
    run(async () => {
      await verifyCode(email, code);
      router.back();
    });

  const canSend = step === 'email' ? EMAIL_RE.test(email.trim()) : /^\d{6}$/.test(code.trim());

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NavHeader modal title="Tu cuenta" />
      <View style={styles.content}>
        {!enabled ? (
          <Text style={styles.text}>
            Las cuentas aún no están disponibles en esta versión. Puedes seguir usando la app sin
            cuenta.
          </Text>
        ) : step === 'email' ? (
          <>
            <Text style={styles.title}>Crea tu cuenta o entra</Text>
            <Text style={styles.text}>
              Te enviaremos un código de 6 cifras a tu email. Sin contraseñas.
            </Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              onSubmitEditing={() => canSend && submitEmail()}
            />
          </>
        ) : (
          <>
            <Text style={styles.title}>Revisa tu email</Text>
            <Text style={styles.text}>Escribe el código que te hemos enviado a {email.trim()}.</Text>
            <TextInput
              style={[styles.input, styles.code]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
            />
            <Pressable onPress={() => setStep('email')} hitSlop={8}>
              <Text style={styles.link}>Cambiar el email o pedir otro código</Text>
            </Pressable>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {enabled && (
          <Pressable
            style={[styles.button, (!canSend || busy) && styles.disabled]}
            disabled={!canSend || busy}
            onPress={step === 'email' ? submitEmail : submitCode}
          >
            {busy ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>
                {step === 'email' ? 'Enviarme el código' : 'Entrar'}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 24, gap: 14 },
    title: { color: COLORS.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
    text: { color: COLORS.muted, fontSize: 15, lineHeight: 21 },
    input: {
      height: 52,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontSize: 17,
    },
    code: { fontSize: 26, letterSpacing: 8, textAlign: 'center', fontVariant: ['tabular-nums'] },
    link: { color: theme.accent, fontSize: 14, fontWeight: '600' },
    error: { color: COLORS.danger, fontSize: 14 },
    button: {
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
      marginTop: 6,
    },
    disabled: { opacity: 0.4 },
    buttonText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  });
