import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileAvatar } from '@/components/profile-avatar';
import { useApp } from '@/data/app-context';
import { BIO_MAX, NAME_MAX, nickError, NICK_MAX, normalizeNick } from '@/data/profile';
import { pickProfilePhoto, saveProfilePhoto } from '@/data/profile-photo';
import { COLORS } from '@/theme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();

  // Borrador: nada se aplica hasta pulsar "Guardar"
  const [nick, setNick] = useState(profile.nick);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [photo, setPhoto] = useState(profile.photo);
  const [saveError, setSaveError] = useState<string | null>(null);

  const error = nickError(nick);
  const changed =
    nick !== profile.nick ||
    name.trim() !== profile.name ||
    bio.trim() !== profile.bio ||
    photo !== profile.photo;
  const canSave = changed && !error;

  const choosePhoto = async () => {
    const uri = await pickProfilePhoto();
    if (uri) setPhoto(uri);
  };

  const save = () => {
    try {
      updateProfile({
        nick,
        name: name.trim(),
        bio: bio.trim(),
        photo: saveProfilePhoto(photo, profile.photo),
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
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>Guardar</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.photo}>
          <ProfileAvatar size={96} uri={photo || undefined} onPress={choosePhoto} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  save: { color: COLORS.accent, fontSize: 16, fontWeight: '700' },
  saveDisabled: { opacity: 0.35 },
  content: { padding: 20 },
  photo: { alignItems: 'center', gap: 12, marginBottom: 12 },
  photoActions: { flexDirection: 'row', gap: 20 },
  link: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },
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
  error: { color: COLORS.danger, fontSize: 13, marginTop: 6 },
});
