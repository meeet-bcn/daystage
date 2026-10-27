// La sala de chat de un concierto. Con backend y cuenta, mensajes del servidor
// (paginados, en tiempo real, con fotos y vídeos en Storage); sin backend, los
// de este móvil en memoria, como antes; con backend pero sin cuenta, la
// pantalla pide crearla (`mode: 'signin'`).

import { useCallback, useEffect, useRef, useState } from 'react';

import { useApp } from '@/data/app-context';
import type { ChatMessage } from '@/data/chat';
import { chatKey } from '@/data/chat';
import * as service from '@/data/chat-service';
import type { Concert } from '@/data/concerts';
import { mergeMessages } from '@/data/remote';
import { useSession } from '@/data/session-context';

export type ChatMode = 'local' | 'signin' | 'remote';

/** `live: false` (información de la sala): carga, pero sin Realtime ni marcar como leído. */
export function useChatRoom(
  concertId: string,
  concert: Concert | undefined,
  { live = true }: { live?: boolean } = {}
) {
  const { messagesFor, sendMessage, sendMedia, refreshUnread } = useApp();
  const { enabled, userId } = useSession();
  const mode: ChatMode = !enabled ? 'local' : userId ? 'remote' : 'signin';
  const room = concert ? service.roomIdFor(concert) : null;

  const [remote, setRemote] = useState<ChatMessage[]>([]);
  // Sala cuya primera página ya llegó (o falló): mientras no sea esta, se está cargando
  const [loadedRoom, setLoadedRoom] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingOlder = useRef(false);

  const markRead = useCallback(() => {
    if (!room || !userId) return;
    service
      .markRoomRead(room, userId)
      .then(refreshUnread)
      .catch((e) => console.warn('[chat] No se pudo marcar como leído:', e));
  }, [room, userId, refreshUnread]);

  useEffect(() => {
    if (mode !== 'remote' || !room || !concert || !userId) return;
    let alive = true;
    // Quien dijo "¡Voy!" antes de tener cuenta aún no está en la sala: se apunta ahora
    service
      .setAttendance(concert, true, userId)
      .then(() => service.fetchMessages(room, userId))
      .then(({ messages, hasMore: more }) => {
        if (!alive) return;
        setRemote(messages);
        setHasMore(more);
        setError(null);
        if (live) markRead();
      })
      .catch((e) => {
        console.warn('[chat] No se pudo cargar la sala:', e);
        if (alive) setError('No se pudo cargar la sala. Comprueba la conexión.');
      })
      .finally(() => alive && setLoadedRoom(room));

    const unsubscribe = live
      ? service.subscribeToRoom(
          room,
          userId,
          (message) => {
            setRemote((current) => mergeMessages(current, [message]));
            if (!message.mine) markRead();
          },
          // Lo que llegó antes de quedar suscritos: la última página otra vez, sin repetir
          () => {
            service
              .fetchMessages(room, userId)
              .then(({ messages }) => alive && setRemote((current) => mergeMessages(current, messages)))
              .catch((e) => console.warn('[chat] Al suscribirse:', e));
          }
        )
      : () => {};
    return () => {
      alive = false;
      unsubscribe();
    };
    // concert cambia de objeto con cada página cargada: basta con su sala
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, room, userId]);

  const loadOlder = useCallback(() => {
    if (mode !== 'remote' || !room || !hasMore || loadingOlder.current || remote.length === 0) return;
    loadingOlder.current = true;
    service
      .fetchMessages(room, userId, remote[0].sentAt)
      .then(({ messages, hasMore: more }) => {
        setRemote((current) => mergeMessages(current, messages));
        setHasMore(more);
      })
      .catch((e) => console.warn('[chat] No se pudieron cargar más mensajes:', e))
      .finally(() => {
        loadingOlder.current = false;
      });
  }, [mode, room, userId, hasMore, remote]);

  const send = useCallback(
    (text: string) => {
      if (mode === 'local') return sendMessage(chatKey(concertId), text);
      if (!room || !userId) return;
      service
        .sendText(room, text, userId)
        .then((message) => setRemote((current) => mergeMessages(current, [message])))
        .catch((e) => {
          console.warn('[chat] No se pudo enviar:', e);
          setError('No se pudo enviar el mensaje.');
        });
    },
    [mode, room, userId, concertId, sendMessage]
  );

  const share = useCallback(
    (uri: string, kind: 'image' | 'video') => {
      if (mode === 'local') {
        return sendMedia(chatKey(concertId), kind === 'video' ? { video: uri } : { photo: uri });
      }
      if (!room || !userId) return;
      service
        .sendMedia(room, uri, kind, userId)
        .then((message) => setRemote((current) => mergeMessages(current, [message])))
        .catch((e) => {
          console.warn('[chat] No se pudo subir:', e);
          setError(kind === 'video' ? 'No se pudo enviar el vídeo.' : 'No se pudo enviar la foto.');
        });
    },
    [mode, room, userId, concertId, sendMedia]
  );

  const block = useCallback(
    async (otherId: string) => {
      if (!userId) return;
      await service.blockUser(otherId, userId);
      // RLS ya no los devuelve; se quitan también de lo cargado
      setRemote((current) => current.filter((m) => m.userId !== otherId));
    },
    [userId]
  );

  const report = useCallback(
    async (otherId: string, messageId?: string) => {
      if (!userId) return;
      await service.reportUser(otherId, userId, messageId);
    },
    [userId]
  );

  return {
    mode,
    messages: mode === 'remote' ? remote : messagesFor(chatKey(concertId)),
    loading: mode === 'remote' && room != null && loadedRoom !== room,
    error,
    hasMore: mode === 'remote' && hasMore,
    loadOlder,
    send,
    share,
    block,
    report,
  };
}
