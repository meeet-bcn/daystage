import { describe, expect, it } from '@jest/globals';

import { makeConcert } from '@/data/__fixtures__/concert';
import { EMPTY_PROFILE } from '@/data/profile';
import {
  concertToRow,
  countsByKey,
  mediaUpload,
  mergeMessages,
  messageFromRow,
  type MessageRow,
  profileToRow,
} from '@/data/remote';

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

const row = (over: Partial<MessageRow> = {}): MessageRow => ({
  id: 'm1',
  room_id: '20261031_salaapolo_nocturna',
  user_id: OTHER,
  text: 'Hola',
  media_path: null,
  media_type: null,
  created_at: '2026-10-31T20:15:00.000Z',
  ...over,
});

describe('messageFromRow', () => {
  it('texto de otra persona', () => {
    expect(messageFromRow(row(), ME)).toEqual({
      id: 'm1',
      sentAt: Date.parse('2026-10-31T20:15:00.000Z'),
      text: 'Hola',
      userId: OTHER,
      mine: false,
    });
  });

  it('los tuyos llevan mine; sin sesión, ninguno', () => {
    expect(messageFromRow(row({ user_id: ME }), ME).mine).toBe(true);
    expect(messageFromRow(row({ user_id: ME }), null).mine).toBe(false);
  });

  it('foto y vídeo con su URL firmada; sin ella, solo la ruta', () => {
    const photo = row({ text: '', media_path: 'sala/u/a.jpg', media_type: 'image' });
    const video = row({ id: 'm2', text: '', media_path: 'sala/u/b.mp4', media_type: 'video' });
    const urls = { 'sala/u/a.jpg': 'https://firmada/a', 'sala/u/b.mp4': 'https://firmada/b' };
    expect(messageFromRow(photo, ME, urls)).toMatchObject({ photo: 'https://firmada/a', mediaPath: 'sala/u/a.jpg' });
    expect(messageFromRow(video, ME, urls)).toMatchObject({ video: 'https://firmada/b' });
    const pending = messageFromRow(photo, ME);
    expect(pending.photo).toBeUndefined();
    expect(pending.mediaPath).toBe('sala/u/a.jpg');
  });
});

describe('mergeMessages', () => {
  it('sin repetir (el de Realtime y el de la respuesta del envío) y en orden', () => {
    const a = messageFromRow(row({ id: 'a', created_at: '2026-10-31T20:00:00Z' }), ME);
    const b = messageFromRow(row({ id: 'b', created_at: '2026-10-31T20:05:00Z' }), ME);
    const c = messageFromRow(row({ id: 'c', created_at: '2026-10-31T19:00:00Z' }), ME);
    expect(mergeMessages([a, b], [b, c]).map((m) => m.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('concertToRow', () => {
  it('id canónico y lo mínimo para mostrarlo', () => {
    const concert = makeConcert({
      artist: 'Nocturna Festival',
      venue: 'Sala Apolo',
      startsAt: new Date(2026, 9, 31, 22, 0).getTime(),
      image: 'https://img/x.jpg',
    });
    expect(concertToRow(concert)).toEqual({
      id: '20261031_salaapolo_nocturnafestival',
      artist: 'Nocturna Festival',
      venue: 'Sala Apolo',
      starts_at: new Date(2026, 9, 31, 22, 0).toISOString(),
      image: 'https://img/x.jpg',
    });
  });

  it('sin fecha, starts_at null', () => {
    expect(concertToRow(makeConcert({ startsAt: null })).starts_at).toBeNull();
  });
});

describe('profileToRow', () => {
  it('perfil público; un nick que el servidor rechazaría no se sube', () => {
    const profile = { ...EMPTY_PROFILE, nick: 'jordi.m', name: 'Jordi', bio: 'Hola' };
    expect(profileToRow(profile)).toEqual({ nick: 'jordi.m', name: 'Jordi', bio: 'Hola', background: 'none' });
    expect(profileToRow({ ...profile, nick: 'jo' }).nick).toBeNull();
    expect(profileToRow({ ...profile, nick: '' }).nick).toBeNull();
  });
});

describe('countsByKey', () => {
  it('filas de RPC → mapa; null → vacío', () => {
    expect(
      countsByKey(
        [
          { room_id: 'a', unread: 3 },
          { room_id: 'b', unread: 1 },
        ],
        'room_id',
        'unread'
      )
    ).toEqual({ a: 3, b: 1 });
    expect(countsByKey(null, 'room_id', 'unread')).toEqual({});
  });
});

describe('mediaUpload', () => {
  it('ruta <sala>/<usuario>/<archivo> con la extensión y el tipo correctos', () => {
    const photo = mediaUpload('sala', ME, 'file:///tmp/IMG_1.HEIC', 'image', 0);
    expect(photo.path).toMatch(new RegExp(`^sala/${ME}/0-[a-z0-9]+\\.heic$`));
    expect(photo.contentType).toBe('image/heic');
    const video = mediaUpload('sala', ME, 'file:///tmp/clip.mov', 'video');
    expect(video.contentType).toBe('video/quicktime');
  });

  it('sin extensión reconocible, la de su tipo', () => {
    expect(mediaUpload('sala', ME, 'ph://ABC-123', 'image').path).toMatch(/\.jpg$/);
    expect(mediaUpload('sala', ME, 'content://media/42', 'video').contentType).toBe('video/mp4');
  });
});
