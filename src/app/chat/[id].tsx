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
import { COLORS } from '@/theme';

const MESSAGE_MAX = 500;

const timeOf = (sentAt: number) =>
  new Date(sentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

/**
 * Chat de un concierto, solo desde la pestaña Meeet in. Lleva solo el evento
 * y su fecha: nada de foto ni de comprar entrada, eso está en el detalle.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { concerts, plans, messagesFor, sendMessage } = useApp();
  const [draft, setDraft] = useState('');

  const concert = concerts.find((c) => c.id === id) ?? plans.find((c) => c.id === id);
  const messages = messagesFor(id);
  const text = draft.trim();

  const send = () => {
    if (!text) return;
    sendMessage(id, text);
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
              Saluda a la gente que va y quedad para veros allí. En la beta, los mensajes solo se
              ven en tu móvil.
            </Text>
          </View>
        }
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe un mensaje"
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

const styles = StyleSheet.create({
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
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  list: { flexGrow: 1, padding: 16, gap: 8 },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: COLORS.accent,
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
  emptyText: { color: COLORS.muted, fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 6 },
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
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.35 },
});
