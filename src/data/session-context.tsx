// SessionProvider / useSession(): tu cuenta en Supabase. El primer método es
// el email: un enlace que vuelve a la app (auth-callback, PKCE) o, si la
// plantilla lo lleva, un código. Apple y Google quedan para después. Sin backend
// configurado, `enabled` es false y no hay sesión: la app sigue en modo local.

import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/data/supabase';

type SessionState = {
  /** Hay backend (claves en .env.local). */
  enabled: boolean;
  session: Session | null;
  userId: string | null;
  email: string | null;
  /** Envía el email para entrar (enlace y, si la plantilla lo lleva, código); crea la cuenta si no existe. */
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  /** Canjea el `code` del enlace del email (auth-callback). */
  exchangeLink: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

function required() {
  if (!supabase) throw new Error('No hay servidor configurado.');
  return supabase;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      enabled: supabase != null,
      session,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      sendCode: async (email) => {
        const { error } = await required().auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
            // Debe estar en las URL de redirección permitidas del proyecto (daystage://**)
            emailRedirectTo: Linking.createURL('auth-callback'),
          },
        });
        if (error) throw error;
      },
      verifyCode: async (email, code) => {
        const { error } = await required().auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'email',
        });
        if (error) throw error;
      },
      exchangeLink: async (code) => {
        const { error } = await required().auth.exchangeCodeForSession(code);
        if (error) throw error;
      },
      signOut: async () => {
        await supabase?.auth.signOut();
      },
    }),
    [session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider');
  return ctx;
}
