-- DayStage · social: días libres compartidos con amigos (seguimiento mutuo).
--
-- Compartir es opcional (Ajustes › Turnos): la app sube aquí si cada día de
-- las próximas semanas libras o trabajas, y lo borra al dejar de compartir.
-- Solo se guarda libre/trabaja, nunca el horario ni el tipo de turno.

-- ¿Os seguís los dos?
create function public.are_mutual(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.follows f1
    join public.follows f2 on f2.follower_id = f1.followee_id and f2.followee_id = f1.follower_id
    where f1.follower_id = a and f1.followee_id = b
  );
$$;

create table public.shared_days (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  day date not null,
  status text not null check (status in ('libre', 'trabaja')),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index shared_days_day_idx on public.shared_days (day);

alter table public.shared_days enable row level security;

-- Tus días los ves tú y quienes os seguís mutuamente
create policy "ver días compartidos" on public.shared_days
  for select to authenticated using (
    user_id = (select auth.uid()) or public.are_mutual((select auth.uid()), user_id)
  );
create policy "compartir mis días" on public.shared_days
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "actualizar mis días" on public.shared_days
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "dejar de compartir" on public.shared_days
  for delete to authenticated using (user_id = (select auth.uid()));
