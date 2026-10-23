import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { AppProvider } from '@/data/app-context';
import { COLORS } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AppProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ contentStyle: { backgroundColor: COLORS.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="concert/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: 'modal' }} />
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
      </AppProvider>
    </ThemeProvider>
  );
}