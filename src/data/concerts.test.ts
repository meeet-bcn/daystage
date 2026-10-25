import { describe, expect, it, jest } from '@jest/globals';

import { withTimeout } from '@/data/concerts';

describe('withTimeout', () => {
  it('deja pasar la respuesta si llega a tiempo', async () => {
    await expect(withTimeout(Promise.resolve(3), 1000, 'bcn')).resolves.toBe(3);
  });

  it('falla si la fuente no responde a tiempo (red que la bloquea)', async () => {
    jest.useFakeTimers();
    const hung = new Promise<never>(() => {});
    const result = withTimeout(hung, 15000, 'ticketmaster');
    jest.advanceTimersByTime(15000);
    await expect(result).rejects.toThrow('ticketmaster no ha respondido a tiempo');
    jest.useRealTimers();
  });

  it('pasa el error de la fuente tal cual', async () => {
    await expect(withTimeout(Promise.reject(new Error('403')), 1000, 'bcn')).rejects.toThrow(
      '403'
    );
  });
});
