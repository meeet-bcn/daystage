// SocialProvider / useSocial(): a quién sigues, quién te sigue y tus amigos
// (os seguís los dos). Si lo activas en Ajustes, comparte con ellos tus
// próximos días: libre o trabajas, nunca el horario. Sin cuenta, todo vacío.

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useApp } from '@/data/app-context';
import { useSession } from '@/data/session-context';
import { daysToShare, mutualIds, type PublicProfile } from '@/data/social';
import * as social from '@/data/social-service';
import { toDateKey } from '@/data/shifts';
import { useShifts } from '@/data/shifts-context';

/** Cuántos días se comparten por delante. */
const SHARE_DAYS = 60;

type SocialState = {
  following: PublicProfile[];
  followers: PublicProfile[];
  /** Ids de tus amigos (seguimiento mutuo): los que ven tus días y tú los suyos. */
  friendIds: string[];
  isFollowing: (id: string) => boolean;
  follow: (person: PublicProfile) => void;
  unfollow: (id: string) => void;
  refresh: () => void;
};

const SocialContext = createContext<SocialState | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  const { settings } = useApp();
  const { plan } = useShifts();
  const [lists, setLists] = useState<{ following: PublicProfile[]; followers: PublicProfile[] }>({
    following: [],
    followers: [],
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    social
      .fetchFollowLists(userId)
      .then(setLists)
      .catch((e) => console.warn('[social] Seguidores:', e));
  }, [userId]);

  useEffect(() => refresh(), [refresh]);

  const follow = useCallback(
    (person: PublicProfile) => {
      if (!userId) return;
      setLists((l) => ({ ...l, following: [...l.following.filter((p) => p.id !== person.id), person] }));
      social.follow(person.id, userId).catch((e) => {
        console.warn('[social] Seguir:', e);
        refresh();
      });
    },
    [userId, refresh]
  );

  const unfollow = useCallback(
    (id: string) => {
      if (!userId) return;
      setLists((l) => ({ ...l, following: l.following.filter((p) => p.id !== id) }));
      social.unfollow(id, userId).catch((e) => {
        console.warn('[social] Dejar de seguir:', e);
        refresh();
      });
    },
    [userId, refresh]
  );

  // Tus días, a tus amigos (solo si lo activas); al desactivarlo se borran
  const shared = useRef(false);
  useEffect(() => {
    if (!userId) return;
    if (!settings.shareDays) {
      if (shared.current) {
        shared.current = false;
        social.unpublishDays(userId).catch((e) => console.warn('[social] Dejar de compartir:', e));
      }
      return;
    }
    const timer = setTimeout(() => {
      social
        .publishDays(userId, daysToShare(plan, toDateKey(), SHARE_DAYS))
        .then(() => {
          shared.current = true;
        })
        .catch((e) => console.warn('[social] Compartir días:', e));
    }, 2000);
    return () => clearTimeout(timer);
  }, [userId, settings.shareDays, plan]);

  const value = useMemo<SocialState>(() => {
    // Sin cuenta (o tras cerrar sesión), listas vacías
    const current = userId ? lists : { following: [], followers: [] };
    const followingIds = new Set(current.following.map((p) => p.id));
    return {
      ...current,
      friendIds: mutualIds(
        current.followers.map((p) => p.id),
        current.following.map((p) => p.id)
      ),
      isFollowing: (id) => followingIds.has(id),
      follow,
      unfollow,
      refresh,
    };
  }, [userId, lists, follow, unfollow, refresh]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial debe usarse dentro de SocialProvider');
  return ctx;
}
