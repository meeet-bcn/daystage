import { describe, expect, it } from '@jest/globals';

import { authErrorMessage } from '@/data/auth-errors';

const err = (message: string, code?: string) => Object.assign(new Error(message), { code });

describe('authErrorMessage', () => {
  it('límite de emails', () => {
    expect(authErrorMessage(err('email rate limit exceeded', 'over_email_send_rate_limit'))).toMatch(
      /Espera un rato/
    );
    expect(authErrorMessage(err('For security purposes, you can only request this after 45 seconds.'))).toMatch(
      /Espera un rato/
    );
  });

  it('enlace o código caducado', () => {
    expect(authErrorMessage(err('Token has expired or is invalid', 'otp_expired'))).toMatch(/Pide otro email/);
    expect(authErrorMessage(err('invalid flow state, no valid flow state found'))).toMatch(/Pide otro email/);
  });

  it('email no válido y sin red', () => {
    expect(authErrorMessage(err('Unable to validate email address: invalid format'))).toBe(
      'Ese email no parece válido.'
    );
    expect(authErrorMessage(new TypeError('Network request failed'))).toMatch(/conexión/);
  });

  it('lo desconocido, genérico', () => {
    expect(authErrorMessage(err('???'))).toBe('Algo ha fallado. Inténtalo otra vez.');
    expect(authErrorMessage(null)).toBe('Algo ha fallado. Inténtalo otra vez.');
  });
});
