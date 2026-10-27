// Turnos en una base SQLite propia (expo-sqlite), en tablas: tipos de turno,
// la rotación (con sus días en orden) y los cambios de días sueltos. Todo es
// síncrono y pequeño, así que se lee entero al arrancar (estado inicial de
// ShiftsProvider) y cada cambio se escribe al momento.
//
// Migraciones con PRAGMA user_version: cada entrada de MIGRATIONS sube una
// versión. No cambies una ya publicada; añade otra al final.

import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import {
  DEFAULT_SHIFT_TYPES,
  type DayOverride,
  type Rotation,
  type ShiftPlan,
  type ShiftType,
} from '@/data/shifts';
import type { ShiftColor } from '@/theme';

const DB_NAME = 'daystage.db';

const MIGRATIONS: ((db: SQLiteDatabase) => void)[] = [
  // 1: tablas y los tres tipos de turno por defecto (solo al crear la base)
  (db) => {
    db.execSync(`
      CREATE TABLE shift_types (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        abbr TEXT NOT NULL,
        color TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        break_minutes INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE rotations (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL
      );
      CREATE TABLE rotation_days (
        rotation_id TEXT NOT NULL REFERENCES rotations(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        shift_type_id TEXT,
        PRIMARY KEY (rotation_id, position)
      );
      CREATE TABLE day_overrides (
        date TEXT PRIMARY KEY NOT NULL,
        shift_type_id TEXT,
        note TEXT
      );
    `);
    DEFAULT_SHIFT_TYPES.forEach((t, i) => insertType(db, t, i));
  },
];

let db: SQLiteDatabase | null = null;

/** Abre la base (una vez) y aplica las migraciones pendientes. */
function database() {
  if (db) return db;
  const opened = openDatabaseSync(DB_NAME);
  opened.execSync('PRAGMA foreign_keys = ON;');
  const row = opened.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  for (let v = row?.user_version ?? 0; v < MIGRATIONS.length; v++) {
    opened.withTransactionSync(() => {
      MIGRATIONS[v](opened);
      opened.execSync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  db = opened;
  return db;
}

// --- Filas ↔ tipos -------------------------------------------------------------

export type ShiftTypeRow = {
  id: string;
  name: string;
  abbr: string;
  color: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
};
export type RotationRow = { id: string; name: string; start_date: string };
export type RotationDayRow = { position: number; shift_type_id: string | null };
export type OverrideRow = { date: string; shift_type_id: string | null; note: string | null };

/** Monta el plan con lo leído de las tablas (sin SQLite, para poder probarlo). */
export function planFromRows(
  types: ShiftTypeRow[],
  rotation: RotationRow | null,
  days: RotationDayRow[],
  overrides: OverrideRow[],
): ShiftPlan {
  return {
    types: types.map((r) => ({
      id: r.id,
      name: r.name,
      abbr: r.abbr,
      color: r.color as ShiftColor,
      start: r.start_time,
      end: r.end_time,
      breakMinutes: r.break_minutes,
    })),
    rotation: rotation
      ? {
          id: rotation.id,
          name: rotation.name,
          startDate: rotation.start_date,
          cycle: [...days].sort((a, b) => a.position - b.position).map((d) => d.shift_type_id),
        }
      : null,
    overrides: Object.fromEntries(
      overrides.map((o) => [
        o.date,
        { date: o.date, shiftTypeId: o.shift_type_id, ...(o.note ? { note: o.note } : {}) },
      ]),
    ),
  };
}

function insertType(target: SQLiteDatabase, t: ShiftType, position: number) {
  target.runSync(
    `INSERT INTO shift_types (id, name, abbr, color, start_time, end_time, break_minutes, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, abbr = excluded.abbr,
       color = excluded.color, start_time = excluded.start_time, end_time = excluded.end_time,
       break_minutes = excluded.break_minutes`,
    t.id, t.name, t.abbr, t.color, t.start, t.end, t.breakMinutes, position,
  );
}

// --- API ---------------------------------------------------------------------------

/** Lee todo. Solo hay una rotación activa (la última guardada). */
export function loadShiftPlan(): ShiftPlan {
  const d = database();
  const types = d.getAllSync<ShiftTypeRow>('SELECT * FROM shift_types ORDER BY position, rowid');
  const rotation = d.getFirstSync<RotationRow>('SELECT * FROM rotations LIMIT 1');
  const days = rotation
    ? d.getAllSync<RotationDayRow>(
        'SELECT position, shift_type_id FROM rotation_days WHERE rotation_id = ?',
        rotation.id,
      )
    : [];
  const overrides = d.getAllSync<OverrideRow>('SELECT * FROM day_overrides');
  return planFromRows(types, rotation, days, overrides);
}

/** Crea o actualiza un tipo; los nuevos van al final. */
export function saveShiftType(type: ShiftType) {
  const d = database();
  const next = d.getFirstSync<{ n: number }>('SELECT COALESCE(MAX(position) + 1, 0) AS n FROM shift_types');
  insertType(d, type, next?.n ?? 0);
}

/** Borra un tipo: en la rotación y en los cambios, esos días pasan a libres. */
export function deleteShiftType(id: string) {
  const d = database();
  d.withTransactionSync(() => {
    d.runSync('DELETE FROM shift_types WHERE id = ?', id);
    d.runSync('UPDATE rotation_days SET shift_type_id = NULL WHERE shift_type_id = ?', id);
    d.runSync('UPDATE day_overrides SET shift_type_id = NULL WHERE shift_type_id = ?', id);
  });
}

/** Sustituye la rotación (solo hay una), o la quita con null. */
export function saveRotation(rotation: Rotation | null) {
  const d = database();
  d.withTransactionSync(() => {
    d.runSync('DELETE FROM rotations');
    if (!rotation) return;
    d.runSync(
      'INSERT INTO rotations (id, name, start_date) VALUES (?, ?, ?)',
      rotation.id, rotation.name, rotation.startDate,
    );
    rotation.cycle.forEach((typeId, i) =>
      d.runSync(
        'INSERT INTO rotation_days (rotation_id, position, shift_type_id) VALUES (?, ?, ?)',
        rotation.id, i, typeId,
      ),
    );
  });
}

export function saveOverride(override: DayOverride) {
  database().runSync(
    `INSERT INTO day_overrides (date, shift_type_id, note) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET shift_type_id = excluded.shift_type_id, note = excluded.note`,
    override.date, override.shiftTypeId, override.note ?? null,
  );
}

/** El día vuelve a seguir la rotación. */
export function deleteOverride(date: string) {
  database().runSync('DELETE FROM day_overrides WHERE date = ?', date);
}
