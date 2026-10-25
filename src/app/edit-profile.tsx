import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ProfileAvatar } from '@/components/profile-avatar';
import { SocialIcon } from '@/components/social-icon';
import { SongPicker } from '@/components/song-picker';
import { SongRow } from '@/components/song-row';
import { useApp } from '@/data/app-context';
import {
  BIO_MAX,
  LOCATION_MAX,
  handleError,
  NAME_MAX,
  nickError,
  NICK_MAX,
  normalizeHandle,
  normalizeNick,
  formatPronouns,
  parsePronouns,
  PRONOUN_OPTIONS,
  PRONOUNS_PICK_MAX,
  togglePronoun,
  SOCIAL_NETWORKS,
  SOCIAL_ORDER,
  Socials,
} from '@/data/profile';
import { deleteTabIcons, pickProfilePhoto, saveProfilePhoto } from '@/data/profile-photo';
import { ProfileSong } from '@/data/songs';
import { useSongPreview } from '@/hooks/use-song-preview';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import {
  COLORS,
  PROFILE_BACKGROUNDS,
  ProfileBackground,
  profileGradient,
  Theme,
  themeFor,
} from '@/theme';

export default function EditProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();

  // Borrador: nada se aplica hasta pulsar "Guardar"
  const [nick, setNick] = useState(profile.nick);
  const [name, setName] = useState(profile.name);
  // Se eligen de una lista, no se escriben
  const [pronouns, setPronouns] = useState(() => parsePronouns(profile.pronouns));
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [socials, setSocials] = useState<Socials>(profile.socials);
  const [song, setSong] = useState<ProfileSong | null>(profile.song);
  const [background, setBackground] = useState<ProfileBackground>(profile.background);
  // Vista previa: el acento del fondo elegido, antes de guardar
  const draftTheme = themeFor(background);
  const [pickingSong, setPickingSong] = useState(false);
  const preview = useSongPreview();
  const [photo, setPhoto] = useState(profile.photo);
  const [saveError, setSaveError] = useState<string | null>(null);

  const error = nickError(nick);
  const socialErrors = SOCIAL_ORDER.map((n) => handleError(n, socials[n]));
  const changed =
    nick !== profile.nick ||
    name.trim() !== profile.name ||
    formatPronouns(pronouns) !== profile.pronouns ||
    bio.trim() !== profile.bio ||
    location.trim() !== profile.location ||
    SOCIAL_ORDER.some((n) => socials[n] !== profile.socials[n]) ||
    song?.id !== profile.song?.id ||
    background !== profile.background ||
    photo !== profile.photo;
  const canSave = changed && !error && socialErrors.every((e) => !e);

  const choosePhoto = async () => {
    const uri = await pickProfilePhoto();
    if (uri) setPhoto(uri);
  };

  const save = () => {
    try {
      const saved = saveProfilePhoto(photo, profile.photo);
      // Sin foto, fuera sus miniaturas; con una nueva, tab-avatar genera las suyas
      if (!saved) deleteTabIcons(profile.tabIcons);
      updateProfile({
        nick,
        name: name.trim(),
        pronouns: formatPronouns(pronouns),
        bio: bio.trim(),
        location: location.trim(),
        socials,
        song,
        background,
        photo: saved,
        ...(!saved && { tabIcons: null }),
      });
      router.back();
    } catch {
      setSaveError('No se ha podido guardar la foto. Prueba con otra.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.cancel}>Cancelar</Text>
        </Pressable>
        <Text style={styles.title}>Editar perfil</Text>
        <Pressable
          onPress={save}
          disabled={!canSave}
          hitSlop={10}
          accessibilityState={{ disabled: !canSave }}
        >
          <Text
            style={[styles.save, { color: draftTheme.accent }, !canSave && styles.saveDisabled]}
          >
            Guardar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.photo}>
          <ProfileAvatar size={96} uri={photo || undefined} onPress={choosePhoto} rounded />
          <View style={styles.photoActions}>
            <Pressable onPress={choosePhoto} hitSlop={8}>
              <Text style={styles.link}>{photo ? 'Cambiar foto' : 'Añadir foto'}</Text>
            </Pressable>
            {photo ? (
              <Pressable onPress={() => setPhoto('')} hitSlop={8}>
                <Text style={styles.linkMuted}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        </View>

        <Text style={styles.label}>Nick</Text>
        <View style={[styles.field, styles.nickField, error && styles.fieldError]}>
          <Text style={styles.at}>@</Text>
          <TextInput
            value={nick}
            onChangeText={(text) => setNick(normalizeNick(text))}
            placeholder="tu_nick"
            placeholderTextColor={COLORS.muted}
            style={styles.nickInput}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            maxLength={NICK_MAX + 1} // uno más para poder avisar del límite
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Cómo quieres que te vean"
          placeholderTextColor={COLORS.muted}
          style={styles.field}
          autoComplete="name"
          maxLength={NAME_MAX}
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Pronombres</Text>
          <Text style={styles.counter}>Hasta {PRONOUNS_PICK_MAX}</Text>
        </View>
        <View style={styles.pronouns}>
          {PRONOUN_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={option}
              active={pronouns.includes(option)}
              onPress={() => setPronouns((current) => togglePronoun(current, option))}
            />
          ))}
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Biografía</Text>
          <Text style={styles.counter}>
            {bio.length}/{BIO_MAX}
          </Text>
        </View>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Qué música te mueve, a qué conciertos no faltas…"
          placeholderTextColor={COLORS.muted}
          style={[styles.field, styles.bio]}
          multiline
          maxLength={BIO_MAX}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Barcelona, o de dónde vienes"
          placeholderTextColor={COLORS.muted}
          style={styles.field}
          autoComplete="postal-address-locality"
          textContentType="addressCity"
          maxLength={LOCATION_MAX}
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Fondo del perfil</Text>
          <Text style={styles.counter}>{PROFILE_BACKGROUNDS[background].label}</Text>
        </View>
        {/* Lo ve cualquiera que entre en tu perfil */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.swatchesScroll}
          contentContainerStyle={styles.swatches}
        >
          {(Object.keys(PROFILE_BACKGROUNDS) as ProfileBackground[]).map((key) => (
            <Pressable
              key={key}
              onPress={() => setBackground(key)}
              style={[
                styles.swatchRing,
                background === key && { borderColor: PROFILE_BACKGROUNDS[key].accent },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: background === key }}
              accessibilityLabel={`Fondo ${PROFILE_BACKGROUNDS[key].label}`}
            >
              <View
                style={[
                  styles.swatch,
                  { experimental_backgroundImage: profileGradient(key) },
                  key === 'none' && styles.swatchNone,
                ]}
              >
                {key === 'none' && <Ionicons name="close" size={18} color={COLORS.muted} />}
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Canción</Text>
        {song ? (
          <SongRow
            song={song}
            playing={preview.isPlaying(song)}
            onTogglePlay={() => preview.toggle(song)}
            onPress={() => {
              preview.stop();
              setPickingSong(true);
            }}
            trailing={
              <Pressable
                onPress={() => {
                  preview.stop();
                  setSong(null);
                }}
                hitSlop={10}
                accessibilityLabel="Quitar canción"
              >
                <Ionicons name="close-circle" size={22} color={COLORS.muted} />
              </Pressable>
            }
          />
        ) : (
          <Pressable style={[styles.field, styles.addSong]} onPress={() => setPickingSong(true)}>
            <Ionicons name="musical-notes" size={18} color={theme.accent} />
            <Text style={styles.addSongText}>Añadir canción</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Redes sociales</Text>
        <View style={styles.socials}>
          {SOCIAL_ORDER.map((network, i) => {
            const { label, icon } = SOCIAL_NETWORKS[network];
            const socialError = socialErrors[i];
            return (
              <View key={network}>
                <View style={[styles.field, styles.nickField, socialError && styles.fieldError]}>
                  <View style={styles.socialIcon}>
                    <SocialIcon icon={icon} size={18} color={COLORS.text} />
                  </View>
                  <Text style={styles.at}>@</Text>
                  <TextInput
                    value={socials[network]}
                    // Acepta también el enlace del perfil pegado tal cual
                    onChangeText={(text) =>
                      setSocials((current) => ({ ...current, [network]: normalizeHandle(text, network) }))
                    }
                    placeholder={`Usuario de ${label}`}
                    placeholderTextColor={COLORS.muted}
                    style={styles.nickInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel={`Usuario de ${label}`}
                    // Sin maxLength: cortaría un enlace pegado antes de sacar el usuario
                  />
                </View>
                {socialError ? <Text style={styles.error}>{socialError}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <SongPicker
        visible={pickingSong}
        onPick={(picked) => {
          setSong(picked);
          setPickingSong(false);
        }}
        onClose={() => setPickingSong(false)}
      />
    </View>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    cancel: { color: COLORS.text, fontSize: 16 },
    title: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
    save: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    saveDisabled: { opacity: 0.35 },
    content: { padding: 20 },
    photo: { alignItems: 'center', gap: 12, marginBottom: 12 },
    photoActions: { flexDirection: 'row', gap: 20 },
    link: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    linkMuted: { color: COLORS.muted, fontSize: 15, fontWeight: '600' },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    label: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 8,
    },
    counter: { color: COLORS.muted, fontSize: 12, marginBottom: 8 },
    field: {
      backgroundColor: COLORS.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: COLORS.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    fieldError: { borderColor: COLORS.danger },
    nickField: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 },
    at: { color: COLORS.muted, fontSize: 16, marginRight: 2 },
    nickInput: { flex: 1, color: COLORS.text, fontSize: 16, paddingVertical: 12 },
    bio: { minHeight: 96 },
    socials: { gap: 10 },
    pronouns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    // Las muestras llegan hasta el borde al deslizar
    swatchesScroll: { marginHorizontal: -20 },
    swatches: { gap: 10, paddingHorizontal: 20 },
    swatchRing: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatch: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchNone: { borderWidth: 1, borderColor: COLORS.line },
    addSong: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addSongText: { color: theme.accent, fontSize: 16, fontWeight: '700' },
    socialIcon: { marginRight: 10 },
    error: { color: COLORS.danger, fontSize: 13, marginTop: 6 },
  });
