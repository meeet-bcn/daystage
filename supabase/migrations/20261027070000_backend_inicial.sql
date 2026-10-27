-- DayStage · backend inicial: perfiles, conciertos, asistencia, salas de chat,
-- mensajes con fotos y vídeos, no leídos, seguidores y moderación mínima.
--
-- Toda la seguridad va por RLS: la app solo lleva la clave publicable.
-- Una sala por concierto (rooms.id = concerts.id = canonicalConcertId de la app).
-- Solo entran en una sala (leer y escribir) quienes van al concierto.

-- ---------------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text unique check (nick is null or nick ~ '^[a-z0-9._]{3,30}$'),
  name text not null default '' check (char_length(name) <= 60),
  photo_url text,
  bio text not null default '' check (char_length(bio) <= 300),
  background text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Los perfiles son públicos (como en Instagram); cada cual edita el suyo
create policy "perfiles visibles" on public.profiles
  for select to anon, authenticated using (true);
create policy "editar mi perfil" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "crear mi perfil" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

-- Al registrarse se crea su perfil vacío
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Conciertos (solo lo mínimo para mostrarlos) y su sala
-- ---------------------------------------------------------------------------

create table public.concerts (
  -- canonicalConcertId: día + sala + artista normalizados ("20261031_salaapolo_nocturna")
  id text primary key check (id ~ '^[a-z0-9_]{3,120}$'),
  artist text not null check (char_length(artist) <= 200),
  venue text not null default '' check (char_length(venue) <= 200),
  starts_at timestamptz,
  image text not null default '',
  created_at timestamptz not null default now()
);

alter table public.concerts enable row level security;

create policy "conciertos visibles" on public.concerts
  for select to anon, authenticated using (true);
-- La app los sube al decir "Meeet In!" (si ya existe, no se toca: sin update)
create policy "añadir conciertos" on public.concerts
  for insert to authenticated with check (true);

create table public.rooms (
  id text primary key references public.concerts (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create policy "salas visibles" on public.rooms
  for select to authenticated using (true);

-- Cada concierto tiene su sala desde que existe
create function public.create_concert_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.rooms (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_concert_created
  after insert on public.concerts
  for each row execute function public.create_concert_room();

-- ---------------------------------------------------------------------------
-- Asistencia ("Meeet In!")
-- ---------------------------------------------------------------------------

create table public.attendance (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  concert_id text not null references public.concerts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, concert_id)
);

create index attendance_concert_idx on public.attendance (concert_id);

alter table public.attendance enable row level security;

create policy "asistencia visible" on public.attendance
  for select to authenticated using (true);
create policy "apuntarme" on public.attendance
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "desapuntarme" on public.attendance
  for delete to authenticated using (user_id = (select auth.uid()));

-- Recuento de quién va, también sin cuenta (solo números, no quién)
create function public.going_counts(concert_ids text[])
returns table (concert_id text, going integer)
language sql
stable
security definer
set search_path = ''
as $$
  select a.concert_id, count(*)::integer
  from public.attendance a
  where a.concert_id = any (concert_ids)
  group by a.concert_id;
$$;

grant execute on function public.going_counts(text[]) to anon, authenticated;

-- ¿Voy a este concierto? (las salas son de quien va)
create function public.is_room_member(room text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.attendance a
    where a.concert_id = room and a.user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Moderación: bloqueos y denuncias
-- ---------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "mis bloqueos" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "bloquear" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "desbloquear" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Mensajes
-- ---------------------------------------------------------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text text not null default '' check (char_length(text) <= 1000),
  -- Ruta en el bucket chat-media: "<sala>/<usuario>/<archivo>"
  media_path text,
  media_type text check (media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  check (char_length(text) > 0 or media_path is not null),
  check ((media_path is null) = (media_type is null))
);

create index messages_room_created_idx on public.messages (room_id, created_at desc);

alter table public.messages enable row level security;

-- Ves los mensajes de las salas de tus conciertos, salvo los de quien bloqueaste
create policy "leer mensajes de mis salas" on public.messages
  for select to authenticated using (
    public.is_room_member(room_id)
    and not exists (
      select 1 from public.blocks b
      where b.blocker_id = (select auth.uid()) and b.blocked_id = messages.user_id
    )
  );
create policy "escribir en mis salas" on public.messages
  for insert to authenticated with check (
    user_id = (select auth.uid()) and public.is_room_member(room_id)
  );
create policy "borrar mis mensajes" on public.messages
  for delete to authenticated using (user_id = (select auth.uid()));

-- Mensajes nuevos en tiempo real (Realtime respeta las políticas de arriba)
alter publication supabase_realtime add table public.messages;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  reason text not null default '' check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Solo se crean y ves las tuyas; las revisa el equipo desde el panel
create policy "denunciar" on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "mis denuncias" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- No leídos: última lectura de cada sala
-- ---------------------------------------------------------------------------

create table public.room_reads (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  room_id text not null references public.rooms (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, room_id)
);

alter table public.room_reads enable row level security;

create policy "mis lecturas" on public.room_reads
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Mensajes sin leer de cada sala (de otros, de quien no bloqueaste, tras tu última lectura)
create function public.unread_counts(room_ids text[])
returns table (room_id text, unread integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.room_id, count(*)::integer
  from public.messages m
  left join public.room_reads r
    on r.room_id = m.room_id and r.user_id = (select auth.uid())
  where m.room_id = any (room_ids)
    and m.user_id <> (select auth.uid())
    and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
  group by m.room_id;
$$;

grant execute on function public.unread_counts(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Seguidores
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "seguidores visibles" on public.follows
  for select to authenticated using (true);
create policy "seguir" on public.follows
  for insert to authenticated with check (follower_id = (select auth.uid()));
create policy "dejar de seguir" on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: fotos y vídeos de las salas
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  false,
  52428800, -- 50 MB (vídeos de hasta 2 min)
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;

-- Ruta: <sala>/<usuario>/<archivo>. Ven los archivos quienes están en la sala;
-- suben solo a su carpeta dentro de una sala suya
create policy "ver archivos de mis salas" on storage.objects
  for select to authenticated using (
    bucket_id = 'chat-media' and public.is_room_member((storage.foldername(name))[1])
  );
create policy "subir a mis salas" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'chat-media'
    and public.is_room_member((storage.foldername(name))[1])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy "borrar mis archivos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'chat-media' and (storage.foldername(name))[2] = (select auth.uid())::text
  );
