import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
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

import { ChatMessage, useApp } from '@/data/app-context';
import { ChatRoom, chatRoomKey, languageLabel } from '@/data/settings';
import { useThemedStyles } from '@/hooks/use-theme';
import { COLORS, Theme } from '@/theme';

const MESSAGE_MAX = 500;

const timeOf = (sentAt: number) =>
  new Date(sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

/**
 * Chat de un concierto, solo desde la pestaña Meeet in. Lleva solo el evento
 * y su fecha: nada de foto ni de comprar entrada, eso está en el detalle.
 * Dos salas: "General", para todos, y la de tu idioma principal (Ajustes),
 * para conocer a gente que lo habla.
 */
export default function ChatScreen() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concerts, plans, messagesFor, sendMessage, settings } = useApp();
  const [draft, setDraft] = useState('');
  const [room, setRoom] = useState<ChatRoom>('general');

  const concert = concerts.find((c) => c.id === id) ?? plans.find((c) => c.id === id);
  const language = languageLabel(settings.mainLanguage);
  const roomKey = chatRoomKey(id, room, settings.mainLanguage);
  const messages = messagesFor(roomKey);
  const text = draft.trim();
  const rooms: { key: ChatRoom; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'language', label: language },
  ];

  const send = () => {
    if (!text) return;
    sendMessage(roomKey, text);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.back}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.artist} numberOfLines={1}>
            {concert?.artist ?? 'Chat'}
          </Text>
          {concert ? <Text style={styles.date}>{concert.date}</Text> : null}
        </View>
      </View>

      <View style={styles.rooms}>
        {rooms.map((r) => (
          <Pressable
            key={r.key}
            style={[styles.room, room === r.key && styles.roomActive]}
            onPress={() => setRoom(r.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: room === r.key }}
          >
            {r.key === 'language' && (
              <Ionicons
                name="language"
                size={15}
                color={room === r.key ? COLORS.text : COLORS.muted}
              />
            )}
            <Text style={[styles.roomText, room === r.key && styles.roomTextActive]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={[...messages].reverse()}
        inverted // lo último, abajo, junto al teclado
        keyExtractor={(m: ChatMessage) => m.id}
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: ChatMessage }) => (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{item.text}</Text>
            <Text style={styles.time}>{timeOf(item.sentAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          // En una lista invertida el vacío sale al revés: se vuelve a girar
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={32} color={COLORS.lavender} />
            <Text style={styles.emptyTitle}>Aún no hay mensajes</Text>
            <Text style={styles.emptyText}>
              {room === 'general'
                ? 'Saluda a la gente que va y quedad para veros allí.'
                : `Sala para quien quiere hablar en ${language}. Tu idioma principal se cambia en Ajustes.`}{' '}
              En la beta, los mensajes solo se ven en tu móvil.
            </Text>
          </View>
        }
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={room === 'general' ? 'Escribe un mensaje' : `Escribe en ${language}`}
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          multiline
          maxLength={MESSAGE_MAX}
        />
        <Pressable
          onPress={send}
          disabled={!text}
          style={[styles.send, !text && styles.sendDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Enviar"
        >
          <Ionicons name="arrow-up" size={20} color={COLORS.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.line,
    },
    back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1, marginRight: 40 },
    artist: { color: COLORS.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
    date: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    rooms: {
      flexDirection: 'row',
      margin: 12,
      padding: 3,
      borderRadius: 14,
      backgroundColor: COLORS.surface,
    },
    room: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 34,
      borderRadius: 11,
    },
    roomActive: { backgroundColor: COLORS.white },
    roomText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    roomTextActive: { color: COLORS.text, fontWeight: '700' },
    list: { flexGrow: 1, padding: 16, gap: 8 },
    bubble: {
      alignSelf: 'flex-end',
      maxWidth: '80%',
      backgroundColor: theme.accent,
      borderRadius: 20,
      borderBottomRightRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    bubbleText: { color: COLORS.white, fontSize: 16, lineHeight: 21 },
    time: { color: 'rgba(255,255,255,0.75)', fontSize: 11, alignSelf: 'flex-end', marginTop: 2 },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      transform: [{ scaleY: -1 }],
    },
    emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptyText: {
      color: COLORS.muted,
      fontSize: 15,
      lineHeight: 21,
      textAlign: 'center',
      marginTop: 6,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.line,
    },
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
    sendDisabled: { opacity: 0.35 },
  });
