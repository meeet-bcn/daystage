// Formatos comunes a todas las ticketeras: cada fuente pasa su fecha local
// (YYYY-MM-DD y HH:MM:SS) por aquí para que todas se vean igual.

export function formatDate(localDate?: string, localTime?: string) {
  if (!localDate) return 'Fecha por confirmar';
  const date = new Date(`${localDate}T${localTime ?? '00:00:00'}`);
  const day = date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = localTime ? ` · ${localTime.slice(0, 5)}` : '';
  return day.charAt(0).toUpperCase() + day.slice(1) + time;
}

export function toTimestamp(localDate?: string, localTime?: string) {
  if (!localDate) return null;
  const time = new Date(`${localDate}T${localTime ?? '00:00:00'}`).getTime();
  return Number.isNaN(time) ? null : time;
}

export function formatPriceRange(min: number, max: number | null, currency = 'EUR') {
  const symbol = currency === 'EUR' ? '€' : currency;
  const low = Math.round(min);
  const high = max != null ? Math.round(max) : low;
  return low === high ? `${low} ${symbol}` : `${low} – ${high} ${symbol}`;
}
