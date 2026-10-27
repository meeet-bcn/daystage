// Errores de Supabase Auth en español llano, para la pantalla de cuenta.

const MESSAGES: { match: RegExp; text: string }[] = [
  {
    match: /rate limit|too many|over_email_send_rate_limit|for security purposes/i,
    text: 'Has pedido varios emails seguidos. Espera un rato (hasta una hora) y vuelve a intentarlo.',
  },
  {
    match: /expired|invalid.*(token|code|otp)|otp_expired|flow state/i,
    text: 'El enlace o el código ya no vale (caduca o solo sirve una vez). Pide otro email.',
  },
  { match: /invalid.*email|email.*invalid|validation_failed/i, text: 'Ese email no parece válido.' },
  { match: /signups? not allowed|signup.*disabled/i, text: 'Ahora mismo no se pueden crear cuentas.' },
  {
    match: /network|fetch|failed to fetch|timeout/i,
    text: 'No hay conexión con el servidor. Comprueba tu red e inténtalo otra vez.',
  },
];

/** Mensaje en español para un error de cuenta (o uno genérico). */
export function authErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? `${error.message} ${(error as { code?: string }).code ?? ''}`
      : String(error ?? '');
  return MESSAGES.find((m) => m.match.test(raw))?.text ?? 'Algo ha fallado. Inténtalo otra vez.';
}
