import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { NavHeader } from '@/components/nav-header';
import { useApp } from '@/data/app-context';
import { MUSIC_TASTES } from '@/data/profile';
import { useSession } from '@/data/session-context';
import { addDays, formatDay, normalizeTimeInput, toDateKey } from '@/data/shifts';
import {
  type DraftErrors,
  EMPTY_DRAFT,
  type EventDraft,
  findDuplicate,
  rowToDraft,
  validateDraft,
  type Visibility,
} from '@/data/user-events';
import { readEventUrl } from '@/data/event-from-url-service';
import { fetchUserEventRow, saveUserEvent } from '@/data/user-events-service';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const VISIBILITY: { key: Visibility; icon: 'globe-outline' | 'lock-closed-outline'; title: string; text: string }[] = [
  {
    key: 'public',
    icon: 'globe-outline',
    title: 'Público',
    text: 'Lo verá cualquiera en DayStage: aparecerá en Inicio, en Buscar y en los calendarios.',
  },
  {
    key: 'private',
    icon: 'lock-closed-outline',
    title: 'Privado',
    text: 'Solo lo verás tú y la gente a la que le pases el enlace.',
  },
];

/**
 * Añadir un concierto que no sale en Buscar (o editar uno tuyo, con `id`):
 * lo imprescindible para una ficha completa y si es público o privado. Quien lo
 * crea queda apuntado («¡Voy!»).
 */
export default function EventFormScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id, title: initialTitle } = useLocalSearchParams<{ id?: string; title?: string }>();
  const { userId, enabled } = useSession();
  const { concerts, addConcerts, isGoing, toggleGoing } = useApp();

  const [draft, setDraft] = useState<EventDraft>(() => ({
    ...EMPTY_DRAFT,
    title: initialTitle ?? '',
    date: toDateKey(),
  }));
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<{ path: string | null; url: string }>({
    path: null,
    url: '',
  });
  const [errors, setErrors] = useState<DraftErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!id);
  // Rellenar desde la web del evento: qué campos se completaron y cuáles faltan
  const [link, setLink] = useState('');
  const [reading, setReading] = useState(false);
  const [filled, setFilled] = useState<Set<keyof EventDraft>>(new Set());
  const [missing, setMissing] = useState<Set<keyof EventDraft>>(new Set());

  // Editar: se carga la fila del servidor
  useEffect(() => {
    if (!id) return;
    fetchUserEventRow(id)
      .then((row) => {
        if (!row) return;
        setDraft(rowToDraft(row));
        const existing = concerts.find((c) => c.id === id);
        setCurrentImage({ path: row.image_path, url: existing?.image ?? '' });
      })
      .catch(() => Alert.alert('No se pudo cargar el evento'))
      .finally(() => setLoadingEdit(false));
    // Solo al abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setMissing((m) => {
      if (!m.has(key)) return m;
      const next = new Set(m);
      next.delete(key);
      return next;
    });
  };
  // Borde del acento en lo que vino de la web; aviso en lo imprescindible que no venía
  const mark = (key: keyof EventDraft) => [
    filled.has(key) && styles.inputFilled,
    missing.has(key) && styles.inputMissing,
    errors[key] && styles.inputError,
  ];

  const fillFromLink = async () => {
    setReading(true);
    const result = await readEventUrl(link, concerts);
    setReading(false);
    if (result.kind === 'error') return Alert.alert('No se ha podido rellenar', result.message);
    if (result.kind === 'existing') {
      const c = result.concert;
      addConcerts([c]);
      return Alert.alert('Ya está en DayStage', `«${c.artist}» (${c.date}, ${c.venue}) ya está en la app.`, [
        { text: 'Verlo', onPress: () => router.replace({ pathname: '/concert/[id]', params: { id: c.id } }) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
    const { info } = result;
    setDraft((d) => ({
      ...d,
      ...info.draft,
      ...(info.coords ? { latitude: info.coords.latitude, longitude: info.coords.longitude } : {}),
    }));
    if (info.imageUrl && !photoUri) setPhotoUri(info.imageUrl);
    setFilled(new Set(info.found));
    setMissing(new Set(info.missing));
    setErrors({});
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = async () => {
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0 || !userId) return;
    setSaving(true);
    try {
      const concert = await saveUserEvent(draft, userId, {
        concertId: id,
        photoUri,
        currentImagePath: currentImage.path,
      });
      addConcerts([concert]);
      // Quien lo crea, va
      if (!id && !isGoing(concert.id)) toggleGoing(concert);
      router.back();
      if (!id) router.push({ pathname: '/concert/[id]', params: { id: concert.id } });
    } catch (e) {
      Alert.alert('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo otra vez.');
    } finally {
      setSaving(false);
    }
  };

  // Antes de guardar un público, aviso si parece que ya existe
  const onSave = () => {
    const duplicate = !id && draft.visibility === 'public' ? findDuplicate(draft, concerts) : null;
    if (!duplicate) return save();
    Alert.alert(
      '¿Ya está en DayStage?',
      `Parece el mismo que «${duplicate.artist}» (${duplicate.date}, ${duplicate.venue}).`,
      [
        { text: 'Ver ese', onPress: () => router.replace({ pathname: '/concert/[id]', params: { id: duplicate.id } }) },
        { text: 'Añadir igualmente', onPress: save },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  if (!enabled || !userId) {
    return (
      <View style={styles.container}>
        <NavHeader modal title="Añadir concierto" />
        <View style={styles.gate}>
          <Ionicons name="add-circle-outline" size={36} color={COLORS.lavender} />
          <Text style={styles.gateTitle}>Para añadir un concierto, entra con tu cuenta</Text>
          <Text style={styles.gateText}>Así podrás editarlo y la gente que vaya podrá hablar en su sala.</Text>
          {enabled && (
            <Pressable style={styles.gateButton} onPress={() => router.push('/sign-in')}>
              <Text style={styles.gateButtonText}>Crear cuenta o entrar</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const photo = photoUri ?? (currentImage.url || null);
  const field = (
    key: keyof EventDraft,
    label: string,
    props: Partial<React.ComponentProps<typeof TextInput>> = {}
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, ...mark(key)]}
        value={draft[key] as string}
        onChangeText={(t) => set(key, t as never)}
        placeholderTextColor={COLORS.muted}
        {...props}
      />
      {errors[key] ? (
        <Text style={styles.error}>{errors[key]}</Text>
      ) : (
        missing.has(key) && <Text style={styles.missing}>La web no lo dice: rellénalo tú.</Text>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader
        modal
        title={id ? 'Editar concierto' : 'Añadir concierto'}
        right={
          saving ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <Pressable onPress={onSave} hitSlop={8} disabled={loadingEdit}>
              <Text style={styles.save}>Guardar</Text>
            </Pressable>
          )
        }
      />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        {/* Lo más rápido: pegar la web del evento y que se rellene sola */}
        {!id && (
          <View style={styles.linkBox}>
            <Text style={styles.linkTitle}>¿Tienes la web del concierto?</Text>
            <Text style={styles.linkText}>Pega el enlace y rellenamos la ficha por ti. Luego revísala.</Text>
            <View style={styles.linkRow}>
              <TextInput
                style={[styles.input, styles.linkInput]}
                value={link}
                onChangeText={setLink}
                placeholder="Pega el enlace del evento"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={() => link.trim() && fillFromLink()}
              />
              <Pressable
                style={[styles.fillButton, (!link.trim() || reading) && styles.fillDisabled]}
                onPress={fillFromLink}
                disabled={!link.trim() || reading}
              >
                {reading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.fillText}>Rellenar</Text>
                )}
              </Pressable>
            </View>
            {filled.size > 0 && (
              <Text style={styles.filledNote}>
                Hemos rellenado {filled.size} {filled.size === 1 ? 'campo' : 'campos'} (marcados).
                {missing.size > 0 ? ' Completa los que faltan.' : ''}
              </Text>
            )}
          </View>
        )}

        {/* Público o privado, lo primero: cambia quién lo verá */}
        <Text style={styles.label}>¿Quién lo verá? *</Text>
        <View style={styles.visibility}>
          {VISIBILITY.map((v) => {
            const active = draft.visibility === v.key;
            return (
              <Pressable
                key={v.key}
                onPress={() => set('visibility', v.key)}
                style={[styles.visOption, active && styles.visActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Ionicons name={v.icon} size={20} color={active ? theme.accent : COLORS.text} />
                <View style={styles.visText}>
                  <Text style={[styles.visTitle, active && { color: theme.accent }]}>{v.title}</Text>
                  <Text style={styles.visDetail}>{v.text}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {errors.visibility && <Text style={styles.error}>{errors.visibility}</Text>}

        {field('title', 'Artista o nombre del concierto *', { placeholder: 'Los Invento', maxLength: 120 })}

        <Text style={styles.label}>Fecha *</Text>
        <View style={[styles.dateRow, ...mark('date')]}>
          <Pressable onPress={() => set('date', addDays(draft.date || toDateKey(), -1))} hitSlop={8} style={styles.dateArrow} accessibilityLabel="Día anterior">
            <Ionicons name="chevron-back" size={22} color={theme.accent} />
          </Pressable>
          <Text style={styles.date}>{draft.date ? formatDay(draft.date) : 'Elige la fecha'}</Text>
          <Pressable onPress={() => set('date', addDays(draft.date || toDateKey(), 1))} hitSlop={8} style={styles.dateArrow} accessibilityLabel="Día siguiente">
            <Ionicons name="chevron-forward" size={22} color={theme.accent} />
          </Pressable>
        </View>
        <View style={styles.jumps}>
          {[7, 30].map((n) => (
            <Pressable key={n} onPress={() => set('date', addDays(draft.date || toDateKey(), n))} hitSlop={6}>
              <Text style={styles.link}>+{n === 7 ? '1 semana' : '1 mes'}</Text>
            </Pressable>
          ))}
        </View>
        {errors.date && <Text style={styles.error}>{errors.date}</Text>}

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Empieza *</Text>
            <TextInput
              style={[styles.input, ...mark('startTime')]}
              value={draft.startTime}
              onChangeText={(t) => set('startTime', normalizeTimeInput(t))}
              placeholder="21:00"
              placeholderTextColor={COLORS.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Acaba</Text>
            <TextInput
              style={[styles.input, ...mark('endTime')]}
              value={draft.endTime}
              onChangeText={(t) => set('endTime', normalizeTimeInput(t))}
              placeholder="Opcional"
              placeholderTextColor={COLORS.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
        {(errors.startTime || errors.endTime) && (
          <Text style={styles.error}>{errors.startTime ?? errors.endTime}</Text>
        )}

        {field('venue', 'Sala o lugar *', { placeholder: 'Sala Apolo', maxLength: 120 })}
        {field('address', 'Dirección', { placeholder: 'Calle, número', maxLength: 200 })}
        {field('city', 'Ciudad *', { placeholder: 'Barcelona', maxLength: 60 })}

        <Text style={styles.label}>Estilo</Text>
        <View style={styles.chips}>
          {MUSIC_TASTES.map((g) => (
            <Chip key={g} label={g} active={draft.genre === g} onPress={() => set('genre', draft.genre === g ? '' : g)} />
          ))}
        </View>

        <Text style={styles.label}>Precio</Text>
        <View style={styles.chips}>
          <Chip label="Gratis" active={draft.priceKind === 'free'} onPress={() => set('priceKind', 'free')} />
          <Chip label="De pago" active={draft.priceKind === 'from'} onPress={() => set('priceKind', 'from')} />
          <Chip label="No lo sé" active={draft.priceKind === 'unknown'} onPress={() => set('priceKind', 'unknown')} />
        </View>
        {draft.priceKind === 'from' &&
          field('price', 'Desde (€) *', { placeholder: '18', keyboardType: 'decimal-pad', maxLength: 7 })}

        {field('ticketUrl', 'Enlace de entradas', {
          placeholder: 'https://…',
          autoCapitalize: 'none',
          autoCorrect: false,
          keyboardType: 'url',
        })}

        <Text style={styles.label}>Foto</Text>
        <Pressable onPress={pickPhoto} style={styles.photo} accessibilityLabel="Elegir foto">
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="image-outline" size={26} color={COLORS.muted} />
              <Text style={styles.photoText}>Elegir foto (si no, se usa la del artista)</Text>
            </View>
          )}
        </Pressable>

        {field('description', 'Descripción', {
          placeholder: 'Quién toca, teloneros, cómo llegar…',
          multiline: true,
          maxLength: 2000,
          style: [styles.input, styles.textarea],
          textAlignVertical: 'top',
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    save: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    label: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 8,
    },
    input: {
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontSize: 16,
      borderWidth: 1.5,
      borderColor: COLORS.surface,
    },
    textarea: { minHeight: 110 },
    inputError: { borderColor: COLORS.danger },
    inputFilled: { borderColor: theme.accent },
    inputMissing: { borderColor: COLORS.peachDeep },
    missing: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
    linkBox: { padding: 14, borderRadius: 16, backgroundColor: theme.accentSoft, gap: 6 },
    linkTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    linkText: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
    linkRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
    linkInput: { flex: 1, backgroundColor: COLORS.background, borderColor: COLORS.background },
    fillButton: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    fillDisabled: { opacity: 0.4 },
    fillText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
    filledNote: { color: theme.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
    error: { color: COLORS.danger, fontSize: 13, marginTop: 6 },
    visibility: { gap: 8 },
    visOption: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: COLORS.surface,
      borderWidth: 1.5,
      borderColor: COLORS.surface,
    },
    visActive: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
    visText: { flex: 1 },
    visTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    visDetail: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
      borderWidth: 1.5,
      borderColor: COLORS.surface,
    },
    dateArrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    date: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 16, fontWeight: '600' },
    jumps: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 8 },
    link: { color: theme.accent, fontSize: 14, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    photo: { height: 170, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.surface },
    photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    photoText: { color: COLORS.muted, fontSize: 14 },
    gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    gateTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
    gateText: { color: COLORS.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' },
    gateButton: {
      marginTop: 8,
      height: 46,
      paddingHorizontal: 24,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    gateButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  });
