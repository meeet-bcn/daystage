import { describe, expect, it } from '@jest/globals';

import {
  formatPronouns,
  handleError,
  loadProfile,
  nickError,
  normalizeHandle,
  normalizeNick,
  parsePronouns,
  SOCIAL_NETWORKS,
  togglePronoun,
} from '@/data/profile';

describe('normalizeNick', () => {
  it.each([
    ['@Jordi', 'jordi'],
    ['  jordi.bcn  ', 'jordi.bcn'],
    ['@@jordi', 'jordi'],
    ['jordi bcn', 'jordibcn'],
    ['', ''],
  ])('"%s" → "%s"', (input, expected) => {
    expect(normalizeNick(input)).toBe(expected);
  });
});

describe('nickError', () => {
  it('acepta nicks válidos y el vacío (es opcional)', () => {
    for (const nick of ['', 'jordi', 'jordi.bcn', 'jordi_23', 'abc', 'a'.repeat(30)]) {
      expect(nickError(nick)).toBeNull();
    }
  });

  it.each([
    ['jo', 'Mínimo 3 caracteres.'],
    ['a'.repeat(31), 'Máximo 30 caracteres.'],
    ['jordí', 'Solo letras sin acentos, números, "." y "_".'],
    ['jordi-bcn', 'Solo letras sin acentos, números, "." y "_".'],
    ['.jordi', 'No puede empezar ni acabar en punto.'],
    ['jordi.', 'No puede empezar ni acabar en punto.'],
    ['jor..di', 'No puede tener dos puntos seguidos.'],
  ])('"%s" → %s', (nick, error) => {
    expect(nickError(nick)).toBe(error);
  });
});

describe('normalizeHandle', () => {
  it.each([
    ['instagram', '@Jordi', 'jordi'],
    ['instagram', '  jordi.bcn ', 'jordi.bcn'],
    ['instagram', 'https://www.instagram.com/jordi.bcn/', 'jordi.bcn'],
    ['instagram', 'instagram.com/jordi?igsh=abc', 'jordi'],
    ['tiktok', 'https://www.tiktok.com/@jordi_23', 'jordi_23'],
    ['x', 'https://x.com/Jordi', 'jordi'],
    ['x', 'https://twitter.com/jordi', 'jordi'],
    ['appleMusic', 'https://music.apple.com/profile/Jordi.bcn', 'jordi.bcn'],
    ['appleMusic', 'https://music.apple.com/es/profile/jordi', 'jordi'],
    ['spotify', 'https://open.spotify.com/user/31AbCdEf?si=xyz', '31AbCdEf'],
    ['spotify', 'https://open.spotify.com/intl-es/user/Jordi_Bcn', 'Jordi_Bcn'],
    ['instagram', '', ''],
  ] as const)('%s: "%s" → "%s"', (network, input, expected) => {
    expect(normalizeHandle(input, network)).toBe(expected);
  });
});

describe('handleError', () => {
  it('acepta usuarios válidos y el vacío', () => {
    expect(handleError('instagram', '')).toBeNull();
    expect(handleError('instagram', 'jordi.bcn')).toBeNull();
    expect(handleError('tiktok', 'jordi_23')).toBeNull();
    expect(handleError('x', 'jordi_23')).toBeNull();
  });

  it('aplica las reglas de cada red', () => {
    expect(handleError('x', 'jordi.bcn')).toBe('Solo letras sin acentos, números y "_".');
    expect(handleError('x', 'a'.repeat(16))).toBe('Máximo 15 caracteres.');
    expect(handleError('tiktok', 'a'.repeat(25))).toBe('Máximo 24 caracteres.');
    expect(handleError('instagram', 'jordí')).toBe('Solo letras sin acentos, números, "." y "_".');
    expect(handleError('spotify', '31AbC-d_e')).toBeNull();
    expect(handleError('spotify', 'jordi bcn')).toBe(
      'Solo letras sin acentos, números, ".", "_" y "-".'
    );
  });
});

describe('SOCIAL_NETWORKS', () => {
  it('construye el enlace del perfil público', () => {
    expect(SOCIAL_NETWORKS.instagram.url('jordi')).toBe('https://www.instagram.com/jordi');
    expect(SOCIAL_NETWORKS.tiktok.url('jordi')).toBe('https://www.tiktok.com/@jordi');
    expect(SOCIAL_NETWORKS.x.url('jordi')).toBe('https://x.com/jordi');
    expect(SOCIAL_NETWORKS.appleMusic.url('jordi')).toBe('https://music.apple.com/profile/jordi');
    expect(SOCIAL_NETWORKS.spotify.url('31AbCd')).toBe('https://open.spotify.com/user/31AbCd');
  });
});

describe('pronombres', () => {
  it('se eligen, se quitan y como mucho tres', () => {
    let picked: string[] = [];
    picked = togglePronoun(picked, 'ella');
    picked = togglePronoun(picked, 'she/her');
    expect(picked).toEqual(['ella', 'she/her']);
    expect(togglePronoun(picked, 'ella')).toEqual(['she/her']);
    const three = togglePronoun(picked, 'elle');
    expect(togglePronoun(three, 'él')).toEqual(three);
  });

  it('se guardan unidos y se leen de vuelta, descartando lo que no es una opción', () => {
    expect(formatPronouns(['ella', 'she/her'])).toBe('ella · she/her');
    expect(parsePronouns('ella · she/her')).toEqual(['ella', 'she/her']);
    expect(parsePronouns('')).toEqual([]);
    expect(parsePronouns('lo que escribí antes')).toEqual([]);
  });
});

describe('loadProfile', () => {
  it('sin nada guardado, perfil vacío y sin crear', () => {
    expect(loadProfile({})).toMatchObject({
      created: false,
      nick: '',
      location: '',
      tastes: [],
    });
  });

  it('las redes nuevas llegan vacías a los perfiles guardados antes', () => {
    const saved = { socials: { instagram: 'jordi', tiktok: '', x: '' } } as never;
    expect(loadProfile(saved).socials).toEqual({
      instagram: 'jordi',
      tiktok: '',
      x: '',
      appleMusic: '',
      spotify: '',
    });
  });

  it('los perfiles guardados sin ubicación la reciben vacía', () => {
    expect(loadProfile({ nick: 'jordi', bio: 'hola' }).location).toBe('');
  });

  it('los perfiles de antes de `created` cuentan como creados si tenían algo', () => {
    expect(loadProfile({ nick: 'jordi' }).created).toBe(true);
    expect(loadProfile({ photo: 'file:///foto.jpg' }).created).toBe(true);
    expect(loadProfile({ bio: 'solo bio' }).created).toBe(false);
    expect(loadProfile({ nick: 'jordi', created: false }).created).toBe(false);
  });
});
