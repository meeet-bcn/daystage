// ShiftsProvider / useShifts(): tus turnos (pestaña Turnos). Aparte de
// app-context para no engordarlo. Se leen de SQLite de forma síncrona al
// arrancar y cada cambio se guarda al momento (shift-db.ts).

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import * as shiftDb from '@/data/shift-db';
import { EMPTY_PLAN, type Rotation, type ShiftPlan, type ShiftType } from '@/data/shifts';

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

export function ShiftsProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState(loadPlan);

  const saveType = useCallback((type: ShiftType) => {
    persist(() => shiftDb.saveShiftType(type));
    setPlan((p) => {
      const exists = p.types.some((t) => t.id === type.id);
      return {
        ...p,
        types: exists ? p.types.map((t) => (t.id === type.id ? type : t)) : [...p.types, type],
      };
    });
  }, []);

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
  }, []);

  const setRotation = useCallback((rotation: Rotation | null) => {
    persist(() => shiftDb.saveRotation(rotation));
    setPlan((p) => ({ ...p, rotation }));
  }, []);

  const setOverride = useCallback((date: string, shiftTypeId: string | null, note?: string) => {
    const override = { date, shiftTypeId, ...(note ? { note } : {}) };
    persist(() => shiftDb.saveOverride(override));
    setPlan((p) => ({ ...p, overrides: { ...p.overrides, [date]: override } }));
  }, []);

  const clearOverride = useCallback((date: string) => {
    persist(() => shiftDb.deleteOverride(date));
    setPlan((p) => {
      const { [date]: _removed, ...overrides } = p.overrides;
      return { ...p, overrides };
    });
  }, []);

  const value = useMemo(
    () => ({ plan, saveType, deleteType, setRotation, setOverride, clearOverride }),
    [plan, saveType, deleteType, setRotation, setOverride, clearOverride],
  );
  return <ShiftsContext.Provider value={value}>{children}</ShiftsContext.Provider>;
}

export function useShifts() {
  const ctx = useContext(ShiftsContext);
  if (!ctx) throw new Error('useShifts debe usarse dentro de ShiftsProvider');
  return ctx;
}
