// Cliente de Supabase (backend de DayStage: cuentas, asistencia y chat).
// Solo con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (la clave
// publicable) en .env.local; sin ellas, `supabase` es null y la app funciona
// en modo local, como antes. La seguridad va toda por RLS (supabase/migrations):
// nunca pongas aquí la clave service_role.

import { createClient } from '@supabase/supabase-js';
import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          // La sesión se guarda en el mismo almacén que el resto de datos del móvil
          storage: Storage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

/** ¿Hay backend? Sin claves en .env.local, todo es local. */
export const backendEnabled = supabase != null;

// En React Native el token solo se refresca con la app en primer plano
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const CHAT_MEDIA_BUCKET = 'chat-media';
