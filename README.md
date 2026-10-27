# DayStage Calendar

Calendario de turnos laborales con conciertos: ves tus días de trabajo y libranza y, encima, los conciertos que te encajan. Nace como fork de **meeet** (app de descubrir conciertos en Barcelona) y reaprovecha su base: Expo SDK 58, React Native 0.88, React 19.3 y TypeScript estricto.

## Arrancar

Requisitos: Node + npm, Xcode (iOS) y/o Android Studio con un emulador (Android). Copia `.env.local` con las claves de las APIs de conciertos.

```bash
npm ci                  # instala dependencias (usa npx expo install para añadir paquetes)
npx expo run:ios        # compila y abre en el simulador de iPhone
npx expo run:android    # compila y abre en el emulador de Android
```

## Comprobaciones

```bash
npm run check           # typecheck + lint + tests: pásalo antes de dar algo por terminado
```
