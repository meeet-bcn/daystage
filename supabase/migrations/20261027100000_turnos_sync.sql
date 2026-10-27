-- DayStage · copia de tus turnos en tu cuenta: tipos, rotación y cambios de
-- día en un solo documento por usuario. Gana el último cambio (updated_at),
-- venga del móvil o del servidor. Solo lo ve y lo cambia su dueño.

create table public.user_shift_plans (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  plan jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_shift_plans enable row level security;

create policy "mis turnos" on public.user_shift_plans
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
