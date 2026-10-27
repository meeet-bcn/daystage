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
import { authErrorMessage } from '@/data/auth-errors';
import { useSession } from '@/data/session-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Crear cuenta o entrar por email (Supabase): con el enlace, que vuelve a la app
 * (auth-callback), o con el código si la plantilla lo lleva (8 cifras en el proyecto).
 * Apple y Google llegarán después. Modal desde el chat o desde Ajustes.
 */
export default function SignInScreen() {
  const styles = useThemedStyles(makeStyles);
  const { enabled, sendCode, verifyCode, signInAnonymously } = useSession();
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
      setError(authErrorMessage(e));
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

  // Solo en desarrollo: entrar sin email para probar el chat (ver session-context)
  const tryWithoutEmail = () =>
    run(async () => {
      await signInAnonymously();
      router.back();
    });

  const canSend = step === 'email' ? EMAIL_RE.test(email.trim()) : /^\d{6,10}$/.test(code.trim());

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
              Te enviaremos un email para entrar. Sin contraseñas.
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
            <Text style={styles.text}>
              Te hemos enviado un email a {email.trim()}. Ábrelo en este móvil y toca el enlace
              «Sign in»: la app se abrirá con la sesión iniciada.
            </Text>
            <Pressable onPress={() => setStep('email')} hitSlop={8}>
              <Text style={styles.link}>Cambiar el email o pedir otro</Text>
            </Pressable>
            {/* Alternativa: solo si la plantilla del email trae el código (hoy, solo enlace) */}
            <Text style={styles.small}>¿El email trae un código en vez de un enlace? Escríbelo aquí:</Text>
            <TextInput
              style={[styles.input, styles.code]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="Código"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {enabled && (step === 'email' || code.length > 0) && (
          <Pressable
            style={[styles.button, (!canSend || busy) && styles.disabled]}
            disabled={!canSend || busy}
            onPress={step === 'email' ? submitEmail : submitCode}
          >
            {busy ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>
                {step === 'email' ? 'Enviarme el email' : 'Entrar con el código'}
              </Text>
            )}
          </Pressable>
        )}

        {__DEV__ && enabled && step === 'email' && (
          <Pressable onPress={tryWithoutEmail} disabled={busy} hitSlop={8} style={styles.devButton}>
            <Text style={styles.link}>Probar sin email (desarrollo)</Text>
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
    code: { fontSize: 20, letterSpacing: 4, textAlign: 'center', fontVariant: ['tabular-nums'] },
    devButton: { alignSelf: 'center', marginTop: 8 },
    small: { color: COLORS.muted, fontSize: 13, marginTop: 18 },
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
