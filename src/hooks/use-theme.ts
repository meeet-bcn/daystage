// Tema de la app: el acento sale del fondo de tu perfil (theme.ts › PROFILE_BACKGROUNDS).
// Los colores de marca (logotipo, imagotipo, icono) no cambian: usan COLORS.

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useApp } from '@/data/app-context';
import { Theme, themeFor } from '@/theme';

export function useTheme(): Theme {
  const { profile } = useApp();
  return useMemo(() => themeFor(profile.background), [profile.background]);
}

/**
 * Estilos que dependen del tema: `make` es `(theme) => StyleSheet.create({...})`
 * fuera del componente; se vuelve a crear solo cuando cambia el tema.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(make: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => make(theme), [make, theme]);
}
