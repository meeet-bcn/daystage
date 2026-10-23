// Medidas de layout por plataforma. Los colores de MEEET están en `@/theme`.

import { Platform } from 'react-native';

/** Alto de la barra de pestañas: súmalo al margen inferior de las pantallas de `(tabs)`. */
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
