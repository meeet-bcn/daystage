import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { Imagotipo } from '@/components/imagotipo';
import { SparkleBurst } from '@/components/meeet-in-burst';
import { OrganicBackdrop } from '@/components/organic-backdrop';
import { useApp } from '@/data/app-context';
import { LANGUAGES } from '@/data/filters';
import { MUSIC_TASTES, NAME_MAX, nickError, NICK_MAX, normalizeNick } from '@/data/profile';
import { pickProfilePhoto, saveProfilePhoto } from '@/data/profile-photo';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

type Step = 'nick' | 'name' | 'photo' | 'tastes' | 'language' | 'done';
const STEPS: Step[] = ['nick', 'name', 'photo', 'tastes', 'language', 'done'];

/**
 * Creación de perfil, un paso por pantalla y sobre el imagotipo animado.
 * Se llega desde la bienvenida o desde Perfil (sin perfil). Solo el nick es
 * obligatorio; lo demás se puede dejar para más tarde.
 */
export default function OnboardingScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, settings, updateSettings, finishWelcome } = useApp();

  const [step, setStep] = useState<Step>('nick');
  const [nick, setNick] = useState(profile.nick);
  const [name, setName] = useState(profile.name);
  const [photo, setPhoto] = useState(profile.photo);
  const [tastes, setTastes] = useState<string[]>(profile.tastes);
  const [language, setLanguage] = useState(settings.mainLanguage);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [burst, setBurst] = useState(true);

  const index = STEPS.indexOf(step);
  const nickProblem = nick === '' ? 'Elige un nick para que te encuentren.' : nickError(nick);

  // Al terminar: a donde se venía (Perfil) o a Inicio (desde la bienvenida)
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const skipAll = () => {
    finishWelcome();
    leave();
  };

  const finish = () => {
    try {
      updateProfile({
        created: true,
        nick,
        name: name.trim(),
        photo: saveProfilePhoto(photo, profile.photo),
        tastes,
      });
      updateSettings({ mainLanguage: language });
      finishWelcome();
      setStep('done');
    } catch {
      setSaveError('No se ha podido guardar la foto. Prueba con otra o sáltala.');
    }
  };

  const next = () => {
    if (step === 'language') return finish();
    setStep(STEPS[index + 1]);
  };
  const back = () => setStep(STEPS[index - 1]);

  const choosePhoto = async () => {
    const uri = await pickProfilePhoto();
    if (uri) setPhoto(uri);
  };

  const canContinue = step !== 'nick' || !nickProblem;
  const optional = step === 'name' || step === 'photo' || step === 'tastes';
  const filled =
    (step === 'name' && name.trim()) ||
    (step === 'photo' && photo) ||
    (step === 'tastes' && tastes.length > 0);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <OrganicBackdrop />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        {index > 0 && step !== 'done' ? (
          <Pressable
            onPress={back}
            hitSlop={10}
            accessibilityLabel="Atrás"
            style={styles.topButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}
        {/* Progreso: un tramo por paso */}
        <View style={styles.progress}>
          {STEPS.slice(0, -1).map((s, i) => (
            <View key={s} style={[styles.segment, i <= index && styles.segmentDone]} />
          ))}
        </View>
        {step !== 'done' ? (
          <Pressable onPress={skipAll} hitSlop={10} style={styles.topButton}>
            <Text style={styles.skip}>Ahora no</Text>
          </Pressable>
        ) : (
          <View style={styles.topButton} />
        )}
      </View>

      {/* Cada paso entra por la derecha y sale por la izquierda */}
      <Animated.View
        key={step}
        entering={FadeInRight.duration(420)}
        exiting={FadeOutLeft.duration(260)}
        style={styles.step}
      >
        {step === 'nick' && (
          <>
            <Text style={styles.kicker}>Paso 1</Text>
            <Text style={styles.title}>Elige tu nick</Text>
            <Text style={styles.text}>Es como te verán en los chats y en tu perfil.</Text>
            <View style={styles.field}>
              <Text style={styles.at}>@</Text>
              <TextInput
                value={nick}
                onChangeText={(text) => setNick(normalizeNick(text))}
                placeholder="tu_nick"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                maxLength={NICK_MAX + 1}
                returnKeyType="next"
                onSubmitEditing={() => canContinue && next()}
              />
            </View>
            {nick !== '' && nickProblem ? <Text style={styles.error}>{nickProblem}</Text> : null}
          </>
        )}

        {step === 'name' && (
          <>
            <Text style={styles.kicker}>Paso 2</Text>
            <Text style={styles.title}>¿Cómo te llamas?</Text>
            <Text style={styles.text}>Tu nombre, o cómo quieres que te llamen.</Text>
            <View style={styles.field}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                autoFocus
                autoComplete="name"
                maxLength={NAME_MAX}
                returnKeyType="next"
                onSubmitEditing={next}
              />
            </View>
          </>
        )}

        {step === 'photo' && (
          <>
            <Text style={styles.kicker}>Paso 3</Text>
            <Text style={styles.title}>Pon una foto</Text>
            <Text style={styles.text}>Para que te reconozcan en la puerta del concierto.</Text>
            <Pressable style={styles.photo} onPress={choosePhoto} accessibilityRole="button">
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoImage} />
              ) : (
                <Ionicons name="camera-outline" size={38} style={styles.photoIcon} />
              )}
            </Pressable>
            <Pressable onPress={choosePhoto} hitSlop={8}>
              <Text style={styles.link}>{photo ? 'Cambiar foto' : 'Elegir de la galería'}</Text>
            </Pressable>
            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          </>
        )}

        {step === 'tastes' && (
          <>
            <Text style={styles.kicker}>Paso 4</Text>
            <Text style={styles.title}>¿Qué música te mueve?</Text>
            <Text style={styles.text}>
              Elige todas las que quieras. Te recomendaremos conciertos.
            </Text>
            <View style={styles.chips}>
              {MUSIC_TASTES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={tastes.includes(t)}
                  onPress={() =>
                    setTastes((current) =>
                      current.includes(t) ? current.filter((x) => x !== t) : [...current, t]
                    )
                  }
                />
              ))}
            </View>
          </>
        )}

        {step === 'language' && (
          <>
            <Text style={styles.kicker}>Paso 5</Text>
            <Text style={styles.title}>¿En qué idioma hablas?</Text>
            <Text style={styles.text}>
              Así podrás conocer a gente que también lo habla en los conciertos.
            </Text>
            <View style={styles.chips}>
              {LANGUAGES.map((l) => (
                <Chip
                  key={l.code}
                  label={l.label}
                  active={language === l.code}
                  onPress={() => setLanguage(l.code)}
                />
              ))}
            </View>
          </>
        )}

        {step === 'done' && (
          <View style={styles.done}>
            <View style={styles.doneMark}>
              <Imagotipo height={90} />
              {burst && <SparkleBurst onEnd={() => setBurst(false)} />}
            </View>
            <Text style={[styles.title, styles.center]}>¡Listo, @{nick}!</Text>
            <Text style={[styles.text, styles.center]}>
              Ya tienes tu perfil. Dale a «¡Voy!» en un concierto y conoce a quien va.
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {step === 'done' ? (
          <Pressable style={styles.primary} onPress={leave}>
            <Text style={styles.primaryText}>Empezar</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.primary, !canContinue && styles.primaryDisabled]}
              onPress={next}
              disabled={!canContinue}
              accessibilityState={{ disabled: !canContinue }}
            >
              <Text style={styles.primaryText}>
                {step === 'language' ? 'Crear mi perfil' : 'Siguiente'}
              </Text>
            </Pressable>
            {/* Los pasos opcionales se pueden saltar */}
            {optional && !filled ? (
              <Pressable onPress={next} hitSlop={8}>
                <Text style={styles.secondaryText}>Más tarde</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.mist },
    top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
    topButton: { minWidth: 72, height: 40, justifyContent: 'center' },
    skip: { color: COLORS.muted, fontSize: 15, fontWeight: '600', textAlign: 'right' },
    progress: { flex: 1, flexDirection: 'row', gap: 5 },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(42,37,64,0.12)' },
    segmentDone: { backgroundColor: theme.accent },
    step: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
    kicker: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    title: { color: COLORS.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.7 },
    text: { color: COLORS.muted, fontSize: 17, lineHeight: 24, marginTop: 10 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 28,
      height: 58,
      borderRadius: 29,
      paddingHorizontal: 22,
      backgroundColor: 'rgba(255,255,255,0.85)',
    },
    at: { color: COLORS.muted, fontSize: 20, marginRight: 2 },
    input: { flex: 1, color: COLORS.text, fontSize: 20, fontWeight: '600' },
    error: { color: COLORS.danger, fontSize: 14, marginTop: 10, marginLeft: 22 },
    photo: {
      alignSelf: 'center',
      width: 150,
      height: 150,
      borderRadius: 75,
      marginTop: 32,
      marginBottom: 16,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderWidth: 3,
      borderColor: theme.accentSoft,
    },
    photoImage: { width: '100%', height: '100%' },
    photoIcon: { color: theme.accent },
    link: { color: theme.accent, fontSize: 16, fontWeight: '700', textAlign: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
    done: { alignItems: 'center' },
    center: { textAlign: 'center' },
    doneMark: { marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
    footer: { paddingHorizontal: 28, gap: 14, alignItems: 'center' },
    primary: {
      alignSelf: 'stretch',
      height: 54,
      borderRadius: 27,
      backgroundColor: COLORS.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryDisabled: { opacity: 0.35 },
    primaryText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
    secondaryText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
  });
