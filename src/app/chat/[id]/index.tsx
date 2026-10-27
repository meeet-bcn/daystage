import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConcertImage } from '@/components/concert-image';
import { Media, MediaViewer } from '@/components/media-viewer';
import { VideoThumb } from '@/components/video-thumb';
import { useApp } from '@/data/app-context';
import { ChatMessage, ChatRow, membersLabel, withDaySeparators } from '@/data/chat';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const MESSAGE_MAX = 1000;
const MEDIA_WIDTH = 230;
const VIDEO_MAX_SECONDS = 120;

const timeOf = (sentAt: number) =>
  new Date(sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images', 'videos'],
  quality: 0.7,
  videoMaxDuration: VIDEO_MAX_SECONDS,
};

/**
 * Sala de chat de un concierto, como Telegram o WhatsApp: cabecera con la foto
 * del evento y sus miembros (toca para ver gente, fotos, vídeos y setlists),
 * mensajes por día, fotos y vídeos (se abren a pantalla completa y se pueden
 * guardar). Una sola sala por concierto, y solo desde la pestaña Meeet in.
 */
export default function ChatScreen() {
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concerts, plans, goingCount } = useApp();
  const [draft, setDraft] = useState('');
  const [viewing, setViewing] = useState<Media | null>(null);

  const concert = concerts.find((c) => c.id === id) ?? plans.find((c) => c.id === id);
  // Con cuenta, la sala del servidor; sin backend, la de este móvil (chat-service, use-chat-room)
  const chat = useChatRoom(id, concert);
  const rows = withDaySeparators(chat.messages);
  const text = draft.trim();
  const members = concert ? Math.max(1, goingCount(concert)) : 1;

  const send = () => {
    if (!text) return;
    chat.send(text);
    setDraft('');
  };

  const share = (result: ImagePicker.ImagePickerResult) => {
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    chat.share(asset.uri, asset.type === 'video' ? 'video' : 'image');
  };

  // Mantener pulsado un mensaje de otra persona: denunciar o bloquear
  const moderate = (message: ChatMessage) => {
    const other = message.userId;
    if (message.mine || !other) return;
    const done = (title: string) => Alert.alert(title);
    const fail = () => Alert.alert('No se pudo hacer', 'Comprueba la conexión e inténtalo otra vez.');
    Alert.alert('Mensaje', undefined, [
      {
        text: 'Denunciar',
        onPress: () =>
          chat
            .report(other, message.id)
            .then(() => done('Gracias. Lo revisaremos.'))
            .catch(fail),
      },
      {
        text: 'Bloquear a esta persona',
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            '¿Bloquear?',
            'Dejarás de ver sus mensajes en todas las salas.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Bloquear',
                style: 'destructive',
                onPress: () => chat.block(other).then(() => done('Bloqueada.')).catch(fail),
              },
            ]
          ),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const pickFromLibrary = async () => share(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));

  const takeWithCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Sin acceso a la cámara', 'Permite a DayStage usar la cámara desde los ajustes del móvil.');
      return;
    }
    share(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const openInfo = () => router.push({ pathname: '/chat/[id]/info', params: { id } });

  const renderRow = ({ item }: { item: ChatRow }) => {
    if (item.kind === 'day') {
      return (
        <View style={styles.day}>
          <Text style={styles.dayText}>{item.label}</Text>
        </View>
      );
    }
    const message: ChatMessage = item.message;
    const media: Media | null = message.photo
      ? { uri: message.photo, kind: 'photo' }
      : message.video
        ? { uri: message.video, kind: 'video' }
        : null;
    const other = message.mine === false;
    return (
      <Pressable
        onLongPress={() => moderate(message)}
        disabled={!other}
        style={[styles.bubble, other && styles.bubbleOther, media && styles.mediaBubble]}
      >
        {media ? (
          <Pressable
            onPress={() => setViewing(media)}
            accessibilityRole="imagebutton"
            accessibilityLabel={media.kind === 'video' ? 'Ver vídeo' : 'Ver foto'}
          >
            {media.kind === 'photo' ? (
              <Image source={{ uri: media.uri }} style={styles.media} contentFit="cover" />
            ) : (
              <VideoThumb uri={media.uri} style={styles.media} />
            )}
          </Pressable>
        ) : (
          <Text style={[styles.bubbleText, other && styles.bubbleTextOther]}>{message.text}</Text>
        )}
        {/* Hora y doble check dentro de la burbuja, como en WhatsApp */}
        <View style={[styles.meta, media && styles.metaOnMedia]} pointerEvents="none">
          <Text style={[styles.time, other && !media && styles.timeOther]}>{timeOf(message.sentAt)}</Text>
          {!other && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.85)" />}
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.back}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={26} color={theme.accent} />
        </Pressable>
        {/* Como en Telegram: tocar la cabecera abre la información de la sala */}
        <Pressable
          style={styles.headerMain}
          onPress={openInfo}
          accessibilityRole="button"
          accessibilityLabel="Información de la sala"
        >
          {concert ? (
            <ConcertImage concert={concert} style={styles.avatar} iconSize={16} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {concert?.artist ?? 'Chat'}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {membersLabel(members)}
              {concert ? ` · ${concert.date}` : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={openInfo} hitSlop={10} accessibilityLabel="Gente, fotos, vídeos y setlist">
          <Ionicons name="information-circle-outline" size={26} color={theme.accent} />
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        data={[...rows].reverse()}
        inverted // lo último, abajo, junto al teclado
        keyExtractor={(row) => row.id}
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.listContent}
        renderItem={renderRow}
        // Al subir (la lista está invertida: el final es lo más antiguo), la página anterior
        onEndReached={chat.loadOlder}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          // Mensaje de servicio, como el de Telegram al crear un grupo.
          // En una lista invertida el vacío sale al revés: se vuelve a girar
          <View style={styles.empty}>
            <View style={styles.service}>
              <Ionicons name="chatbubbles-outline" size={30} color={COLORS.text} />
              <Text style={styles.serviceTitle}>La sala del concierto</Text>
              <Text style={styles.serviceText}>
                Saluda a la gente que va, quedad para veros allí y comparte fotos, vídeos o el
                setlist.
                {chat.mode === 'local' ? ' De momento, los mensajes solo se ven en tu móvil.' : ''}
                {chat.loading ? '\n\nCargando mensajes…' : ''}
              </Text>
            </View>
          </View>
        }
      />

      {chat.error && <Text style={styles.error}>{chat.error}</Text>}

      {chat.mode === 'signin' ? (
        // Con servidor, para hablar con la gente que va hace falta una cuenta
        <View style={[styles.signin, { paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.signinText}>
            Crea tu cuenta (o entra) para hablar con la gente que va a este concierto.
          </Text>
          <Pressable style={styles.signinButton} onPress={() => router.push('/sign-in')}>
            <Text style={styles.signinButtonText}>Crear cuenta o entrar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            onPress={pickFromLibrary}
            hitSlop={8}
            style={styles.attach}
            accessibilityLabel="Enviar una foto o un vídeo"
          >
            <Ionicons name="attach" size={26} color={COLORS.muted} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Mensaje"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            multiline
            maxLength={MESSAGE_MAX}
          />
          {text ? (
            <Pressable
              onPress={send}
              style={styles.send}
              accessibilityRole="button"
              accessibilityLabel="Enviar"
            >
              <Ionicons name="arrow-up" size={20} color={COLORS.white} />
            </Pressable>
          ) : (
            <Pressable
              onPress={takeWithCamera}
              hitSlop={8}
              style={styles.attach}
              accessibilityLabel="Hacer una foto o un vídeo"
            >
              <Ionicons name="camera-outline" size={24} color={COLORS.muted} />
            </Pressable>
          )}
        </View>

      )}

      <MediaViewer media={viewing} onClose={() => setViewing(null)} />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.mist },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
      paddingBottom: 8,
      backgroundColor: COLORS.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    back: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface },
    headerText: { flex: 1 },
    title: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 1 },
    list: { flex: 1 },
    listContent: { flexGrow: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
    day: {
      alignSelf: 'center',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginVertical: 6,
      backgroundColor: 'rgba(42,37,64,0.08)',
    },
    dayText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
    bubble: {
      alignSelf: 'flex-end',
      maxWidth: '80%',
      backgroundColor: theme.accent,
      borderRadius: 18,
      borderBottomRightRadius: 5,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 6,
    },
    mediaBubble: { padding: 3, overflow: 'hidden' },
    media: {
      width: MEDIA_WIDTH,
      height: MEDIA_WIDTH * 1.2,
      borderRadius: 15,
      overflow: 'hidden',
      backgroundColor: COLORS.text,
    },
    bubbleText: { color: COLORS.white, fontSize: 16, lineHeight: 21 },
    // Mensajes de los demás: a la izquierda y en blanco, como en WhatsApp
    bubbleOther: {
      alignSelf: 'flex-start',
      backgroundColor: COLORS.background,
      borderBottomRightRadius: 18,
      borderBottomLeftRadius: 5,
    },
    bubbleTextOther: { color: COLORS.text },
    timeOther: { color: COLORS.muted },
    error: { color: COLORS.danger, fontSize: 13, textAlign: 'center', paddingVertical: 6 },
    signin: {
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 10,
      backgroundColor: COLORS.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.line,
    },
    signinText: { color: COLORS.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    signinButton: {
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    signinButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      gap: 3,
      marginTop: 2,
    },
    metaOnMedia: {
      position: 'absolute',
      right: 10,
      bottom: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 9,
      backgroundColor: 'rgba(42,37,64,0.45)',
    },
    time: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      transform: [{ scaleY: -1 }],
    },
    service: {
      alignItems: 'center',
      gap: 6,
      padding: 18,
      borderRadius: 18,
      backgroundColor: 'rgba(42,37,64,0.06)',
    },
    serviceTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
    serviceText: { color: COLORS.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      paddingHorizontal: 8,
      paddingTop: 8,
      backgroundColor: COLORS.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.line,
    },
    attach: { width: 38, height: 40, alignItems: 'center', justifyContent: 'center' },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      borderRadius: 20,
      backgroundColor: COLORS.surface,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      color: COLORS.text,
      fontSize: 16,
    },
    send: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
