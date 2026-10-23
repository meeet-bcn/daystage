import { describe, expect, it } from '@jest/globals';

import { pickTopSong, toSong } from '@/data/songs';

const track = {
  trackId: 1809774259,
  trackName: 'Despechá',
  artistName: 'ROSALÍA',
  artworkUrl100:
    'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/ab/cd/196873046495.jpg/100x100bb.jpg',
  previewUrl:
    'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/v4/mzaf_1.plus.aac.p.m4a',
  trackViewUrl: 'https://music.apple.com/es/album/despech%C3%A1/1809774257?i=1809774259&uo=4',
};

describe('toSong', () => {
  it('convierte un resultado de iTunes con la carátula más grande', () => {
    expect(toSong(track)).toEqual({
      id: '1809774259',
      title: 'Despechá',
      artist: 'ROSALÍA',
      artwork:
        'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/ab/cd/196873046495.jpg/300x300bb.jpg',
      preview: track.previewUrl,
      url: track.trackViewUrl,
    });
  });

  it('descarta las canciones sin fragmento o sin datos básicos', () => {
    expect(toSong({ ...track, previewUrl: undefined })).toBeNull();
    expect(toSong({ ...track, trackName: '' })).toBeNull();
    expect(toSong({ ...track, trackViewUrl: undefined })).toBeNull();
  });

  it('sin carátula deja el campo vacío', () => {
    expect(toSong({ ...track, artworkUrl100: undefined })?.artwork).toBe('');
  });
});

describe('pickTopSong', () => {
  const song = (id: number, artistName: string, artistId = 1) => ({
    ...track,
    trackId: id,
    artistName,
    artistId,
  });

  it('elige la primera canción del artista (la más popular)', () => {
    const tracks = [song(1, 'Otro Grupo', 9), song(2, 'Rosalía'), song(3, 'ROSALÍA')];
    expect(pickTopSong(tracks, 'ROSALÍA')?.id).toBe('2');
  });

  it('acepta colaboraciones si el artista va primero y "The" delante', () => {
    expect(pickTopSong([song(1, 'ROSALÍA & Björk')], 'Rosalía')?.id).toBe('1');
    expect(pickTopSong([song(1, 'The Chameleons')], 'Chameleons')?.id).toBe('1');
    expect(pickTopSong([song(1, 'Björk, ROSALÍA')], 'Rosalía')).toBeNull();
  });

  it('ante homónimos (varios artistas con el mismo nombre) no elige ninguno', () => {
    expect(pickTopSong([song(1, 'Nova', 1), song(2, 'Nova', 2)], 'Nova')).toBeNull();
  });

  it('salta las canciones sin fragmento', () => {
    const tracks = [{ ...song(1, 'Rosalía'), previewUrl: undefined }, song(2, 'Rosalía')];
    expect(pickTopSong(tracks, 'Rosalía')?.id).toBe('2');
  });

  it('sin coincidencias, null', () => {
    expect(pickTopSong([song(1, 'Otro Grupo')], 'Rosalía')).toBeNull();
    expect(pickTopSong([], 'Rosalía')).toBeNull();
  });
});
