// Qué secciones se ven bajo el mes en el Calendario (Calendario › Editar).
// Por defecto, la vista mínima: el mes y tus planes.

export type CalendarSection = 'planes' | 'leyenda' | 'informe' | 'ticket' | 'tipos' | 'rotacion';

export const CALENDAR_SECTIONS: { key: CalendarSection; label: string }[] = [
  { key: 'planes', label: 'Tus planes del mes' },
  { key: 'leyenda', label: 'Leyenda' },
  { key: 'informe', label: 'Informe de horas' },
  { key: 'ticket', label: 'Ticket comida' },
  { key: 'tipos', label: 'Tipos de turno' },
  { key: 'rotacion', label: 'Rotación' },
];

export type CalendarSections = Record<CalendarSection, boolean>;

export const DEFAULT_CALENDAR_SECTIONS: CalendarSections = {
  planes: true,
  leyenda: false,
  informe: false,
  ticket: false,
  tipos: false,
  rotacion: false,
};

/** Lo guardado sobre los valores por defecto (las secciones nuevas toman el suyo). */
export function calendarSectionsWithDefaults(saved: unknown): CalendarSections {
  const out = { ...DEFAULT_CALENDAR_SECTIONS };
  if (saved && typeof saved === 'object') {
    for (const { key } of CALENDAR_SECTIONS) {
      const v = (saved as Record<string, unknown>)[key];
      if (typeof v === 'boolean') out[key] = v;
    }
  }
  return out;
}
