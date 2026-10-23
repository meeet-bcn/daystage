// Persistencia local (expo-sqlite/kv-store). Solo datos del usuario en este
// móvil: planes y perfil. Los conciertos se vuelven a pedir a la API.

import Storage from 'expo-sqlite/kv-store';

/** Las claves llevan versión: si cambia la forma de los datos, se sube y se empieza de cero. */
export const STORAGE_KEYS = {
  plans: 'meeet.plans.v1',
  profile: 'meeet.profile.v1',
} as const;

/** Lectura síncrona, para el estado inicial. Ante datos ausentes o corruptos, `fallback`. */
export function loadJSON<T extends object>(key: string, fallback: T): T {
  try {
    const raw = Storage.getItemSync(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Escritura en segundo plano; si falla, la app sigue funcionando en memoria. */
export function saveJSON(key: string, value: unknown) {
  Storage.setItem(key, JSON.stringify(value)).catch((e) => {
    console.warn(`[storage] No se pudo guardar ${key}:`, e);
  });
}
