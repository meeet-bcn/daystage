import { describe, expect, it } from '@jest/globals';

import { cleanName, isTestEvent, parseEventInfo } from '@/data/event-info';

// Fragmentos reales de la Discovery API de Ticketmaster (Barcelona, oct. 2026)
const FONTAINES =
  'A handling fee of 2€ applies per order. Support: CHALK Minors under 16 years of age may only enter the venue if accompanied by a parent, legal guardian, or an authorized responsible adult with a ticket in the same section. Digital tickets This is an event with digital tickets (PDF or paper tickets are not available).';
const JOE_JACKSON =
  'Joe Jackson, uno de los grandes exquisitos de la new wave británica, nos presenta (acompañado de su banda) su nuevo disco, "Hope And Fury". Horarios Apertura de Puertas 19:30h Artista Principal 20:30h Edades Acceso permitido a mayores de 16 años. Los menores de 16 años, deberán estar acompañados por madre, padre o tutor legal.';
const LIDO =
  'La colombiana Lido Pimienta nos presenta su nuevo disco, "Caribenya", un álbum divertido y arraigado en la resistencia. Artista Invitado: Mas Aya Horarios Apertura de puertas: 20:00h Edades Menores de 16 años podrán acceder acompañados de madre, padre o tutor legal.';
const SCHENKER =
  'Michael Schenker vuelve a girar por España con MSG después de 4 años, con el mítico vocalista Robin McAuley. Horarios Apertura de puertas: 19:00h Acceso Entrada prohibida a menores de 18 años. Entradas digitales Este es un evento con entradas digitales.';
const CHAMELEONS =
  'La legendaria banda de Manchester, pionera del post-punk, regresa con su primer álbum de estudio en dos décadas. Horarios Apertura de puertas: 19:00h Artista Invitado: 19:30h Edades Los menores de 16 años sólo podrán acceder al recinto acompañados de un adulto responsable.';

describe('parseEventInfo', () => {
  it('descarta la letra pequeña cuando no hay reseña (Fontaines D.C.)', () => {
    expect(parseEventInfo(undefined, FONTAINES)).toEqual({
      about: '',
      doors: '',
      support: 'CHALK',
      ages: 'Menores de 16, con un adulto',
    });
  });

  it('corta la reseña donde empieza la logística y saca la hora de puertas', () => {
    const info = parseEventInfo(undefined, JOE_JACKSON);
    expect(info.about).toMatch(/"Hope And Fury"\.$/);
    expect(info.about).not.toMatch(/Horarios|Edades/);
    expect(info.doors).toBe('19:30');
  });

  it('reconoce al artista invitado y lo saca de la reseña', () => {
    const info = parseEventInfo(undefined, LIDO);
    expect(info.support).toBe('Mas Aya');
    expect(info.about).not.toMatch(/Artista Invitado/);
    expect(info.doors).toBe('20:00');
  });

  it('distingue "solo mayores" de "menores acompañados"', () => {
    expect(parseEventInfo(undefined, SCHENKER).ages).toBe('Solo mayores de 18');
    expect(parseEventInfo(undefined, JOE_JACKSON).ages).toBe('Menores de 16, con un adulto');
  });

  it('no confunde una hora con el nombre del telonero', () => {
    expect(parseEventInfo(undefined, CHAMELEONS).support).toBe('');
  });

  it('prefiere `description` y la limpia de espacios y líneas vacías', () => {
    const info = parseEventInfo('  Primera línea  \n \n Segunda   línea ', JOE_JACKSON);
    expect(info.about).toBe('Primera línea\nSegunda línea');
    // La logística se sigue leyendo de `info`
    expect(info.doors).toBe('19:30');
  });

  it('descarta restos editoriales demasiado cortos', () => {
    expect(parseEventInfo(undefined, 'Arctic Tour 2026 Horarios Apertura de puertas: 19:00h').about).toBe(
      ''
    );
  });

  it('devuelve todo vacío sin textos', () => {
    expect(parseEventInfo()).toEqual({ about: '', doors: '', support: '', ages: '' });
  });
});

describe('cleanName', () => {
  it('quita saltos de línea y espacios de más', () => {
    expect(cleanName('Fontaines D.C. - D.C. EU TOUR 2026\n')).toBe('Fontaines D.C. - D.C. EU TOUR 2026');
    expect(cleanName('  Joe   Jackson ')).toBe('Joe Jackson');
  });
});

describe('isTestEvent', () => {
  it('detecta eventos de prueba sin tocar nombres reales', () => {
    expect(isTestEvent('Test 11068686 case')).toBe(true);
    expect(isTestEvent('Testament')).toBe(false);
    expect(isTestEvent('The Test Dream')).toBe(false);
  });
});
