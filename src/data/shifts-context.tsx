// ShiftsProvider / useShifts(): tus turnos (pestaña Turnos). Aparte de
// app-context para no engordarlo. Se leen de SQLite de forma síncrona al
// arrancar y cada cambio se guarda al momento (shift-db.ts). Con cuenta, hay
// una copia en el servidor (shift-sync): gana el último cambio.

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useSession } from '@/data/session-context';
import * as shiftDb from '@/data/shift-db';
import { syncDecision } from '@/data/shift-sync';
import { fetchRemotePlan, pushPlan } from '@/data/shift-sync-service';
import { loadJSON, saveJSON } from '@/data/storage';
import { type DayOverride, EMPTY_PLAN, type Rotation, type ShiftPlan, type ShiftType } from '@/data/shifts';

type ShiftsState = {
  plan: ShiftPlan;
  saveType: (type: ShiftType) => void;
  deleteType: (id: string) => void;
  /** Sustituye la rotación (o la quita con null). */
  setRotation: (rotation: Rotation | null) => void;
  /** Ese día, otro turno o libre (`null`), en vez del de la rotación. */
  setOverride: (date: string, shiftTypeId: string | null, note?: string) => void;
  /** El día vuelve a seguir la rotación. */
  clearOverride: (date: string) => void;
  /** Turnos › Importar: tipos nuevos y cambios de día (los días importados mandan sobre la rotación). */
  importShifts: (types: ShiftType[], overrides: DayOverride[]) => void;
};

const ShiftsContext = createContext<ShiftsState | null>(null);

function loadPlan(): ShiftPlan {
  try {
    return shiftDb.loadShiftPlan();
  } catch (e) {
    // Sin base de datos (p. ej. web), la app sigue funcionando en memoria
    console.warn('[turnos] No se pudo abrir la base de datos:', e);
    return EMPTY_PLAN;
  }
}

/** Guarda en la base; si falla, el cambio queda solo en memoria. */
function persist(write: () => void) {
  try {
    write();
  } catch (e) {
    console.warn('[turnos] No se pudo guardar:', e);
  }
}

// Cuándo cambiaron por última vez tus turnos en este móvil (para la copia de tu cuenta)
const UPDATED_KEY = 'daystage.shifts-updated.v1';

export function ShiftsProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState(loadPlan);
  const [updatedAt, setUpdatedAt] = useState<number | null>(
    () => loadJSON<{ at: number | null }>(UPDATED_KEY, { at: null }).at
  );
  // Cada cambio hecho aquí marca la hora (lo que baja del servidor trae la suya)
  const setPlan = useCallback((update: (p: ShiftPlan) => ShiftPlan) => {
    setPlanState(update);
    setUpdatedAt(Date.now());
  }, []);

  const saveType = useCallback((type: ShiftType) => {
    persist(() => shiftDb.saveShiftType(type));
    setPlan((p) => {
      const exists = p.types.some((t) => t.id === type.id);
      return {
        ...p,
        types: exists ? p.types.map((t) => (t.id === type.id ? type : t)) : [...p.types, type],
      };
    });
  }, [setPlan]);

  const deleteType = useCallback((id: string) => {
    persist(() => shiftDb.deleteShiftType(id));
    setPlan((p) => ({
      types: p.types.filter((t) => t.id !== id),
      rotation: p.rotation && {
        ...p.rotation,
        cycle: p.rotation.cycle.map((c) => (c === id ? null : c)),
      },
      overrides: Object.fromEntries(
        Object.entries(p.overrides).map(([date, o]) => [
          date,
          o.shiftTypeId === id ? { ...o, shiftTypeId: null } : o,
        ]),
      ),
    }));
  }, [setPlan]);

  const setRotation = useCallback((rotation: Rotation | null) => {
    persist(() => shiftDb.saveRotation(rotation));
    setPlan((p) => ({ ...p, rotation }));
  }, [setPlan]);

  const setOverride = useCallback((date: string, shiftTypeId: string | null, note?: string) => {
    const override = { date, shiftTypeId, ...(note ? { note } : {}) };
    persist(() => shiftDb.saveOverride(override));
    setPlan((p) => ({ ...p, overrides: { ...p.overrides, [date]: override } }));
  }, [setPlan]);

  const clearOverride = useCallback((date: string) => {
    persist(() => shiftDb.deleteOverride(date));
    setPlan((p) => {
      const { [date]: _removed, ...overrides } = p.overrides;
      return { ...p, overrides };
    });
  }, [setPlan]);

  const importShifts = useCallback((types: ShiftType[], overrides: DayOverride[]) => {
    persist(() => shiftDb.importShifts(types, overrides));
    setPlan((p) => ({
      ...p,
      types: [...p.types.filter((t) => !types.some((n) => n.id === t.id)), ...types],
      overrides: { ...p.overrides, ...Object.fromEntries(overrides.map((o) => [o.date, o])) },
    }));
  }, [setPlan]);

  useEffect(() => saveJSON(UPDATED_KEY, { at: updatedAt }), [updatedAt]);

  // --- Copia en tu cuenta -------------------------------------------------------
  const { userId } = useSession();
  // Lo último que coincide con el servidor: no se vuelve a subir
  const synced = useRef<number | null>(null);

  // Al entrar con tu cuenta: subir o bajar, según cuál sea más nuevo
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    synced.current = null;
    fetchRemotePlan(userId)
      .then((remote) => {
        if (!alive) return;
        const decision = syncDecision(updatedAt, remote?.updatedAt ?? null);
        if (decision === 'pull' && remote) {
          persist(() => shiftDb.replaceShiftPlan(remote.plan));
          setPlanState(remote.plan);
          setUpdatedAt(remote.updatedAt);
          synced.current = remote.updatedAt;
        } else if (decision === 'none') {
          synced.current = updatedAt;
        }
        // 'push': lo hace el efecto de abajo (synced sigue en null)
      })
      .catch((e) => console.warn('[turnos] No se pudo leer la copia de tu cuenta:', e));
    return () => {
      alive = false;
    };
    // Solo al cambiar de cuenta; los cambios posteriores se suben abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Cada cambio, a tu cuenta (agrupando los seguidos)
  useEffect(() => {
    if (!userId || updatedAt == null || synced.current === updatedAt) return;
    const timer = setTimeout(() => {
      pushPlan(userId, plan, updatedAt)
        .then(() => {
          synced.current = updatedAt;
        })
        .catch((e) => console.warn('[turnos] No se pudo guardar la copia en tu cuenta:', e));
    }, 1500);
    return () => clearTimeout(timer);
  }, [userId, plan, updatedAt]);

  const value = useMemo(
    () => ({ plan, saveType, deleteType, setRotation, setOverride, clearOverride, importShifts }),
    [plan, saveType, deleteType, setRotation, setOverride, clearOverride, importShifts],
  );
  return <ShiftsContext.Provider value={value}>{children}</ShiftsContext.Provider>;
}

export function useShifts() {
  const ctx = useContext(ShiftsContext);
  if (!ctx) throw new Error('useShifts debe usarse dentro de ShiftsProvider');
  return ctx;
}
