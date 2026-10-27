import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ReminderScheduler } from '@/components/reminder-scheduler';
import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { AppProvider } from '@/data/app-context';
import { SessionProvider } from '@/data/session-context';
import { SocialProvider } from '@/data/social-context';
import { ShiftsProvider } from '@/data/shifts-context';
import { COLORS } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      {/* Cuenta y turnos por fuera: AppProvider los usa (asistencia, chat, "Mis días libres") */}
      <SessionProvider>
        <ShiftsProvider>
          <AppProvider>
            <SocialProvider>
              <AnimatedSplashOverlay />
              {/* Avisos antes del turno y el día antes de cada concierto */}
              <ReminderScheduler />
              <Stack screenOptions={{ contentStyle: { backgroundColor: COLORS.background } }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="concert/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]/index" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]/info" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="follows" options={{ headerShown: false }} />
                {/* Buscar: desde la lupa de la cabecera de Inicio (ya no es pestaña) */}
                <Stack.Screen name="buscar" options={{ headerShown: false }} />
                {/* Añadir o editar un concierto propio (desde Buscar o su ficha) */}
                <Stack.Screen name="event-form" options={{ headerShown: false, presentation: 'modal' }} />
                {/* Turnos: tipos de turno, su editor (modal), la rotación y la hoja de un día */}
                <Stack.Screen name="shift-types" options={{ headerShown: false }} />
                <Stack.Screen name="shift-type" options={{ headerShown: false, presentation: 'modal' }} />
                {/* Cuenta: código por email (Supabase) */}
                <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="auth-callback" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="rotation" options={{ headerShown: false }} />
                {/* Calendario › Editar: qué secciones se ven bajo el mes */}
                <Stack.Screen name="calendar-sections" options={{ headerShown: false }} />
                <Stack.Screen name="shift-import" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen
                  name="shift-day"
                  options={{
                    headerShown: false,
                    presentation: 'formSheet',
                    sheetAllowedDetents: [0.7, 1],
                    sheetGrabberVisible: true,
                    sheetCornerRadius: 28,
                  }}
                />
                {/* Bienvenida y creación de perfil: a pantalla completa, sin volver con el gesto */}
                <Stack.Screen
                  name="welcome"
                  options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
                />
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
                />
                <Stack.Screen
                  name="edit-profile"
                  options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                  name="calendar"
                  options={{
                    headerShown: false,
                    presentation: 'formSheet',
                    sheetAllowedDetents: [1],
                    sheetGrabberVisible: true,
                    sheetCornerRadius: 28,
                  }}
                />
                <Stack.Screen
                  name="filters"
                  options={{
                    headerShown: false,
                    presentation: 'formSheet',
                    sheetAllowedDetents: [0.75, 1],
                    sheetGrabberVisible: true,
                    sheetCornerRadius: 28,
                  }}
                />
              </Stack>
            </SocialProvider>
          </AppProvider>
        </ShiftsProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
