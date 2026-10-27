-- DayStage · eventos propios: conciertos que alguien añade porque no salen en
-- las fuentes. Públicos (los ve cualquiera con sesión) o privados (solo quien
-- lo crea y sus invitados; el enlace para compartir lleva el id, que sirve de
-- invitación con `join_private_event`). Solo el creador edita o borra.

create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  visibility text not null check (visibility in ('public', 'private')),
  title text not null check (char_length(title) between 2 and 120),
  venue text not null check (char_length(venue) between 2 and 120),
  address text not null default '' check (char_length(address) <= 200),
  city text not null check (char_length(city) between 2 and 60),
  latitude double precision,
  longitude double precision,
  starts_at timestamptz not null,
  ends_at timestamptz,
  genre text not null default '' check (char_length(genre) <= 40),
  -- null = sin precio; 0 = gratis
  price_min numeric check (price_min is null or price_min >= 0),
  ticket_url text not null default '' check (ticket_url = '' or ticket_url ~ '^https?://'),
  -- Ruta en el bucket event-images: "<usuario>/<archivo>"
  image_path text,
  description text not null default '' check (char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index user_events_starts_idx on public.user_events (starts_at);

create table public.event_invites (
  event_id uuid not null references public.user_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.user_events enable row level security;
alter table public.event_invites enable row level security;

create function public.is_event_invited(event uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_invites i
    where i.event_id = event and i.user_id = (select auth.uid())
  );
$$;

create policy "ver eventos" on public.user_events
  for select to authenticated using (
    visibility = 'public'
    or created_by = (select auth.uid())
    or public.is_event_invited(id)
  );
create policy "crear eventos" on public.user_events
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "editar mis eventos" on public.user_events
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));
create policy "borrar mis eventos" on public.user_events
  for delete to authenticated using (created_by = (select auth.uid()));

-- Invitaciones: las ve el invitado y el creador; las crea el creador
create policy "ver invitaciones" on public.event_invites
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.user_events e where e.id = event_id and e.created_by = (select auth.uid()))
  );
create policy "invitar" on public.event_invites
  for insert to authenticated with check (
    exists (select 1 from public.user_events e where e.id = event_id and e.created_by = (select auth.uid()))
  );
create policy "quitar invitación" on public.event_invites
  for delete to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.user_events e where e.id = event_id and e.created_by = (select auth.uid()))
  );

-- Abrir un privado con su enlace: quien tiene el id (imposible de adivinar) se invita
create function public.join_private_event(event uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return false;
  end if;
  if not exists (select 1 from public.user_events e where e.id = event) then
    return false;
  end if;
  insert into public.event_invites (event_id, user_id)
  values (event, (select auth.uid()))
  on conflict do nothing;
  return true;
end;
$$;

grant execute on function public.join_private_event(uuid) to authenticated;

-- Fotos de los eventos: se ven con su URL pública; cada cual sube a su carpeta
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', true, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "subir fotos de mis eventos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'event-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "borrar fotos de mis eventos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'event-images' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Denunciar un evento público (reutiliza reports)
alter table public.reports add column event_id uuid references public.user_events (id) on delete set null;
