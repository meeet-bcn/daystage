import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authErrorMessage } from '@/data/auth-errors';
import { useSession } from '@/data/session-context';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

/**
 * Vuelta del enlace del email (daystage://auth-callback?code=…): canjea el
 * código por la sesión (PKCE) y vuelve a la app. Si el enlace caducó o ya se
 * usó, Supabase manda `error_description`.
 */
export default function AuthCallback() {
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { exchangeLink } = useSession();
  const [error, setError] = useState<string | null>(
    params.error_description ? authErrorMessage(new Error(params.error_description)) : null
  );

  // Un código solo se canjea una vez (al entrar cambia la sesión y con ella exchangeLink)
  const exchanged = useRef(false);
  useEffect(() => {
    if (!params.code || exchanged.current) return;
    exchanged.current = true;
    exchangeLink(params.code)
      .then(() => router.replace('/'))
      .catch((e) => setError(authErrorMessage(e)));
  }, [params.code, exchangeLink]);

  return (
    <View style={styles.container}>
      {error || !params.code ? (
        <>
          <Text style={styles.title}>No se pudo entrar</Text>
          <Text style={styles.text}>
            {error ?? 'El enlace no es válido.'} Pide otro email desde Ajustes › Cuenta.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>Volver</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator color={COLORS.muted} />
          <Text style={styles.text}>Entrando…</Text>
        </>
      )}
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 32,
      backgroundColor: COLORS.background,
    },
    title: { color: COLORS.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
    text: { color: COLORS.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' },
    button: {
      height: 46,
      paddingHorizontal: 28,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  });
