// Prueba de punta a punta del backend contra Supabase LOCAL (Docker), con las
// mismas llamadas que src/data/chat-service.ts: dos usuarios entran con el
// código por email (leído de Mailpit), se apuntan a un concierto, chatean,
// suben una foto, marcan como leído, denuncian y bloquean, y se comprueba RLS.
//
// Uso: npx supabase start  →  npm run backend:e2e  →  npx supabase stop
// Nunca contra el proyecto remoto: crea usuarios y datos de prueba.

import { execSync } from 'node:child_process';

import { createClient } from '@supabase/supabase-js';

const status = Object.fromEntries(
  execSync('npx supabase status -o env', { encoding: 'utf8' })
    .split('\n')
    .map((line) => /^([A-Z_]+)="?(.*?)"?$/.exec(line))
    .filter(Boolean)
    .map((m) => [m[1], m[2]])
);
const URL = status.API_URL;
const KEY = status.ANON_KEY;
const MAIL = status.MAILPIT_URL ?? status.INBUCKET_URL;
if (!URL?.startsWith('http://127.0.0.1')) throw new Error('Solo contra Supabase local');

const RUN = Date.now().toString(36);
const ROOM = `20261101_salaapolo_e2e${RUN}`;
let failed = 0;
const ok = (label, cond, extra = '') => {
  if (!cond) failed++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${extra ? ' · ' + extra : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function codeFor(email) {
  for (let i = 0; i < 20; i++) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=to:${encodeURIComponent(email)}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) {
      const msg = await (await fetch(`${MAIL}/api/v1/message/${id}`)).json();
      const m = /(\d{6})/.exec(msg.Text ?? '');
      if (m) return m[1];
    }
    await sleep(500);
  }
  throw new Error(`Sin código para ${email} (¿plantilla sin {{ .Token }}?)`);
}

async function signIn(email) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } });
  const sent = await c.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (sent.error) throw sent.error;
  const { data, error } = await c.auth.verifyOtp({ email, token: await codeFor(email), type: 'email' });
  if (error) throw error;
  return { c, id: data.user.id };
}

const a = await signIn(`ana.${RUN}@daystage.test`);
const b = await signIn(`bruno.${RUN}@daystage.test`);
ok('registro e inicio con código por email (2 usuarios)', a.id && b.id);

// Perfil (upsertProfile)
let r = await a.c.from('profiles').upsert({ id: a.id, nick: `ana.${RUN}`, name: 'Ana', bio: '', background: 'none', updated_at: new Date().toISOString() });
ok('perfil propio', !r.error, r.error?.message);
r = await b.c.from('profiles').upsert({ id: a.id, nick: 'hack', name: 'x', bio: '', background: 'none' });
ok('no puedes editar el perfil de otro', !!r.error);

// Meeet In! (setAttendance)
const concert = { id: ROOM, artist: 'Nocturna Festival', venue: 'Sala Apolo', starts_at: new Date(2026, 9, 31, 22).toISOString(), image: '' };
r = await a.c.from('concerts').upsert(concert, { onConflict: 'id', ignoreDuplicates: true });
ok('subir concierto', !r.error, r.error?.message);
r = await b.c.from('concerts').upsert(concert, { onConflict: 'id', ignoreDuplicates: true });
ok('subir el mismo concierto otra vez (ignorado)', !r.error, r.error?.message);
r = await a.c.from('attendance').upsert({ user_id: a.id, concert_id: ROOM }, { ignoreDuplicates: true });
ok('A se apunta', !r.error, r.error?.message);

// B aún no va: no puede escribir
r = await b.c.from('messages').insert({ room_id: ROOM, user_id: b.id, text: 'intruso' });
ok('quien no va no escribe en la sala', !!r.error);
r = await b.c.from('attendance').upsert({ user_id: b.id, concert_id: ROOM }, { ignoreDuplicates: true });
ok('B se apunta', !r.error, r.error?.message);

// Recuento sin cuenta (going_counts)
const anon = createClient(URL, KEY, { auth: { persistSession: false } });
r = await anon.rpc('going_counts', { concert_ids: [ROOM, 'otro'] });
ok('recuento sin cuenta', r.data?.[0]?.going === 2, JSON.stringify(r.data ?? r.error));

// Realtime: A escucha la sala
const received = [];
const channel = a.c.channel(`room:${ROOM}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${ROOM}` }, (p) => received.push(p.new));
await new Promise((res) => channel.subscribe((s) => s === 'SUBSCRIBED' && res()));
await sleep(4000); // en local, el primer suscriptor tarda en tener la replicación lista

// Texto (sendText)
r = await b.c.from('messages').insert({ room_id: ROOM, user_id: b.id, text: '¡Hola! ¿Quedamos en la puerta?' }).select().single();
ok('B envía un mensaje', !r.error && r.data?.text, r.error?.message);
const fromB = r.data;

// Foto (sendMedia): subir a Storage + mensaje + URL firmada
const path = `${ROOM}/${b.id}/test.png`;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
r = await b.c.storage.from('chat-media').upload(path, png, { contentType: 'image/png' });
ok('B sube una foto a su carpeta de la sala', !r.error, r.error?.message);
r = await b.c.storage.from('chat-media').upload(`${ROOM}/${a.id}/suplantar.png`, png, { contentType: 'image/png' });
ok('no puedes subir a la carpeta de otro', !!r.error);
r = await b.c.from('messages').insert({ room_id: ROOM, user_id: b.id, media_path: path, media_type: 'image' }).select().single();
ok('mensaje con foto', !r.error, r.error?.message);
r = await a.c.storage.from('chat-media').createSignedUrls([path], 3600);
const signed = r.data?.[0]?.signedUrl;
ok('A obtiene la URL firmada', !!signed, r.error?.message ?? r.data?.[0]?.error);
if (signed) ok('la URL firmada descarga la foto', (await fetch(signed)).ok);

await sleep(2000);
ok('A recibe en tiempo real los mensajes de B', received.length === 2, `${received.length} recibidos`);

// Paginación (fetchMessages)
r = await a.c.from('messages').select('*').eq('room_id', ROOM).order('created_at', { ascending: false }).limit(40);
ok('A carga la sala', r.data?.length === 2, r.error?.message);

// No leídos
r = await a.c.rpc('unread_counts', { room_ids: [ROOM] });
ok('A tiene 2 sin leer', r.data?.[0]?.unread === 2, JSON.stringify(r.data ?? r.error));
r = await a.c.from('room_reads').upsert({ user_id: a.id, room_id: ROOM, last_read_at: new Date().toISOString() });
ok('A marca la sala como leída', !r.error, r.error?.message);
r = await a.c.rpc('unread_counts', { room_ids: [ROOM] });
ok('A ya no tiene sin leer', (r.data ?? []).length === 0, JSON.stringify(r.data ?? r.error));

// Denunciar y bloquear
r = await a.c.from('reports').insert({ reporter_id: a.id, reported_user_id: b.id, message_id: fromB.id, reason: '' });
ok('A denuncia un mensaje de B', !r.error, r.error?.message);
r = await a.c.from('blocks').upsert({ blocker_id: a.id, blocked_id: b.id }, { ignoreDuplicates: true });
ok('A bloquea a B', !r.error, r.error?.message);
r = await a.c.from('messages').select('*').eq('room_id', ROOM);
ok('A ya no ve los mensajes de B', r.data?.length === 0, `${r.data?.length}`);

// Desapuntarse
r = await b.c.from('attendance').delete().eq('user_id', b.id).eq('concert_id', ROOM);
ok('B se desapunta', !r.error, r.error?.message);
r = await b.c.from('messages').select('*').eq('room_id', ROOM);
ok('B ya no ve la sala', r.data?.length === 0);

await a.c.removeChannel(channel);
process.exit(failed ? 1 : 0);
