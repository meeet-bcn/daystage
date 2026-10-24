import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ComponentProps, ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { useApp } from '@/data/app-context';
import { LANGUAGES } from '@/data/filters';
import { deleteTabIcons, saveProfilePhoto } from '@/data/profile-photo';
import { MESSAGES_FROM_OPTIONS, Settings } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';
import { COLORS } from '@/theme';

function Section({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
      {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
    </View>
  );
}

function Row({
  icon,
  label,
  detail,
  onPress,
  right,
  danger = false,
  first = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  detail?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  first?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? COLORS.danger : COLORS.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, !first && styles.rowLine, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={danger ? COLORS.danger : theme.accent} />
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color }]}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      {right ??
        (onPress ? <Ionicons name="chevron-forward" size={18} color={COLORS.muted} /> : null)}
    </Pressable>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  const theme = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: theme.accent, false: COLORS.line }}
    />
  );
}

/** Ajustes de la app (Perfil › engranaje). */
export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, profile, trimConcerts, clearUserData } = useApp();
  const [cacheCleared, setCacheCleared] = useState(false);

  const notify = (changes: Partial<Settings['notifications']>) =>
    updateSettings({ notifications: { ...settings.notifications, ...changes } });

  const clearCache = async () => {
    // Fotos (memoria y disco) y conciertos de más allá de la primera página
    await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
    trimConcerts();
    setCacheCleared(true);
  };

  // Borra planes, perfil (con la foto), ajustes y chats. Con la bienvenida
  // pendiente otra vez, las pestañas redirigen a ella
  const confirmClearData = (title: string, then: () => void) =>
    Alert.alert(
      title,
      'Se borrarán de este móvil tus planes, tu perfil (con la foto), tus ajustes y tus chats, y volverás a ver la bienvenida. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            saveProfilePhoto('', profile.photo); // borra la foto guardada
            deleteTabIcons(profile.tabIcons);
            clearUserData();
            then();
          },
        },
      ]
    );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.back}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Ajustes</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Cuenta">
          <Row
            first
            icon="person-circle-outline"
            label="Editar perfil"
            detail="Foto, nick, bio, fondo, canción y redes"
            onPress={() => router.push('/edit-profile')}
          />
        </Section>

        <Section
          title="Idioma principal"
          footer="El que más hablas. Da nombre a la segunda sala del chat de cada concierto, para conocer a gente que también lo habla."
        >
          <View style={styles.chips}>
            {LANGUAGES.map((l) => (
              <Chip
                key={l.code}
                label={l.label}
                active={settings.mainLanguage === l.code}
                onPress={() => updateSettings({ mainLanguage: l.code })}
              />
            ))}
          </View>
        </Section>

        <Section
          title="Privacidad"
          footer="Aún no hay cuentas: estas opciones se guardan y se aplicarán cuando otros puedan ver tu perfil."
        >
          <Row
            first
            icon="lock-closed-outline"
            label="Perfil privado"
            detail="Solo te ve la gente que sigues"
            right={
              <Toggle
                value={settings.privateProfile}
                onChange={(privateProfile) => updateSettings({ privateProfile })}
              />
            }
          />
          <Row
            icon="grid-outline"
            label="Mostrar mis conciertos"
            detail="En la cuadrícula de tu perfil"
            right={
              <Toggle
                value={settings.showPlans}
                onChange={(showPlans) => updateSettings({ showPlans })}
              />
            }
          />
          <View style={[styles.row, styles.rowLine, styles.rowColumn]}>
            <View style={styles.rowHead}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.accent} />
              <Text style={styles.rowLabel}>Quién puede escribirme</Text>
            </View>
            <View style={styles.chipsInline}>
              {MESSAGES_FROM_OPTIONS.map((o) => (
                <Chip
                  key={o.key}
                  label={o.label}
                  active={settings.messagesFrom === o.key}
                  onPress={() => updateSettings({ messagesFrom: o.key })}
                />
              ))}
            </View>
          </View>
        </Section>

        <Section
          title="Notificaciones"
          footer="La app aún no envía notificaciones: tus preferencias se guardan para cuando lo haga."
        >
          <Row
            first
            icon="chatbubbles-outline"
            label="Mensajes de los chats"
            right={
              <Toggle value={settings.notifications.chat} onChange={(chat) => notify({ chat })} />
            }
          />
          <Row
            icon="alarm-outline"
            label="Recordatorio el día antes"
            detail="De los conciertos a los que vas"
            right={
              <Toggle
                value={settings.notifications.reminders}
                onChange={(reminders) => notify({ reminders })}
              />
            }
          />
          <Row
            icon="sparkles-outline"
            label="Conciertos nuevos"
            detail="De artistas que te gustan"
            right={
              <Toggle
                value={settings.notifications.newConcerts}
                onChange={(newConcerts) => notify({ newConcerts })}
              />
            }
          />
        </Section>

        <Section title="Experiencia">
          <Row
            first
            icon="phone-portrait-outline"
            label="Vibración"
            detail="Al darle a «Meeet In!»"
            right={
              <Toggle
                value={settings.haptics}
                onChange={(haptics) => updateSettings({ haptics })}
              />
            }
          />
          <Row
            icon="volume-medium-outline"
            label="Sonidos"
            detail="Al recargar Inicio"
            right={
              <Toggle value={settings.sounds} onChange={(sounds) => updateSettings({ sounds })} />
            }
          />
          <Row icon="location-outline" label="Ciudad" detail="Barcelona (beta)" />
        </Section>

        <Section title="Datos y almacenamiento">
          <Row
            first
            icon="trash-bin-outline"
            label={cacheCleared ? 'Caché vaciada' : 'Vaciar caché'}
            detail="Fotos guardadas y conciertos cargados"
            onPress={cacheCleared ? undefined : clearCache}
            right={
              cacheCleared ? (
                <Ionicons name="checkmark" size={20} color={theme.accent} />
              ) : undefined
            }
          />
          <Row
            icon="warning-outline"
            label="Borrar mis datos"
            detail="Planes, perfil, ajustes y chats de este móvil"
            danger
            onPress={() => confirmClearData('¿Borrar tus datos?', () => router.back())}
          />
        </Section>

        <Section title="Información">
          <Row
            first
            icon="musical-notes-outline"
            label="Conciertos"
            detail="Ticketmaster y Agenda Cultural del Ajuntament de Barcelona (Open Data BCN, CC BY 4.0)"
          />
          <Row icon="people-outline" label="Información de artistas" detail="MusicBrainz" />
          <Row icon="logo-apple" label="Fragmentos de canciones" detail="Apple Music" />
          <Row
            icon="information-circle-outline"
            label="Versión"
            detail={`meeet ${Constants.expoConfig?.version ?? ''} · beta`}
          />
        </Section>

        <Section
          title="Empezar de nuevo"
          footer="Para volver a ver la bienvenida y crear el perfil desde cero."
        >
          <Row
            first
            icon="refresh-outline"
            label="Borrar perfil y empezar de nuevo"
            danger
            onPress={() => confirmClearData('¿Empezar de nuevo?', () => router.replace('/welcome'))}
          />
        </Section>

        <Text style={styles.slogan}>Every event. Everyone.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.line,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionFooter: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginHorizontal: 4,
  },
  card: { backgroundColor: COLORS.background, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  rowColumn: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1 },
  rowLabel: { color: COLORS.text, fontSize: 16 },
  rowDetail: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  chipsInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slogan: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 8 },
});
