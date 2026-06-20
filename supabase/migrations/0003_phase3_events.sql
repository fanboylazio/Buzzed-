-- =============================================================================
-- Buzzed · Migración Fase 3 (Eventos + Equipos + Stats por evento)
-- -----------------------------------------------------------------------------
-- Añade eventos (públicos/privados), participación, equipos (individual/pareja/
-- trío/equipo) y la vinculación de consumiciones y publicaciones a un evento.
-- Las consumiciones y posts asociados a un evento son visibles para sus
-- miembros (el "diario compartido"), manteniendo lo personal privado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EVENTS
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  tipo          text not null default 'publico' check (tipo in ('publico', 'privado')),
  fecha_inicio  timestamptz not null default now(),
  fecha_fin     timestamptz,
  creador_id    uuid not null references public.profiles (id) on delete cascade,
  portada_url   text,
  created_at    timestamptz not null default now()
);

comment on table public.events is 'Eventos públicos o privados del grupo.';

-- -----------------------------------------------------------------------------
-- TEAMS: equipos dentro de un evento (individual | pareja | trio | equipo).
-- team_members es la fuente de verdad de quién está en cada equipo.
-- -----------------------------------------------------------------------------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  nombre      text not null,
  tipo        text not null default 'equipo'
                check (tipo in ('individual', 'pareja', 'trio', 'equipo')),
  created_at  timestamptz not null default now()
);

comment on table public.teams is 'Equipos/parejas/tríos dentro de un evento.';

create table if not exists public.team_members (
  team_id     uuid not null references public.teams (id) on delete cascade,
  usuario_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (team_id, usuario_id)
);

comment on table public.team_members is 'Pertenencia usuario ↔ equipo.';

-- -----------------------------------------------------------------------------
-- EVENT_MEMBERS: participación usuario ↔ evento, con rol.
-- (La pertenencia a equipo se consulta vía team_members + teams.event_id.)
-- -----------------------------------------------------------------------------
create table if not exists public.event_members (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  usuario_id  uuid not null references public.profiles (id) on delete cascade,
  rol         text not null default 'miembro' check (rol in ('creador', 'miembro')),
  created_at  timestamptz not null default now(),
  unique (event_id, usuario_id)
);

comment on table public.event_members is 'Participación de usuarios en eventos.';

create index if not exists idx_event_members_event on public.event_members (event_id);
create index if not exists idx_event_members_user on public.event_members (usuario_id);
create index if not exists idx_teams_event on public.teams (event_id);

-- -----------------------------------------------------------------------------
-- Vinculación de consumiciones y posts a eventos (FK sobre columnas existentes).
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'consumption_logs_evento_id_fkey'
  ) then
    alter table public.consumption_logs
      add constraint consumption_logs_evento_id_fkey
      foreign key (evento_id) references public.events (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'posts_evento_id_fkey'
  ) then
    alter table public.posts
      add constraint posts_evento_id_fkey
      foreign key (evento_id) references public.events (id) on delete set null;
  end if;
end $$;

create index if not exists idx_consumption_logs_evento
  on public.consumption_logs (evento_id);
create index if not exists idx_posts_evento on public.posts (evento_id);

-- =============================================================================
-- FUNCIONES DE VISIBILIDAD (security definer: consultan sin RLS, evitan recursión)
-- =============================================================================
create or replace function public.event_is_public(p_event uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.events e where e.id = p_event and e.tipo = 'publico');
$$;

create or replace function public.event_creator(p_event uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select e.creador_id from public.events e where e.id = p_event;
$$;

create or replace function public.is_event_member(p_event uuid, p_user uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.event_members m
    where m.event_id = p_event and m.usuario_id = p_user
  );
$$;

-- ¿Puede el usuario actual ver el evento? (público, miembro o creador)
create or replace function public.can_view_event(p_event uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    public.event_is_public(p_event)
    or public.event_creator(p_event) = auth.uid()
    or public.is_event_member(p_event, auth.uid());
$$;

create or replace function public.team_event_id(p_team uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select t.event_id from public.teams t where t.id = p_team;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.events        enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.event_members enable row level security;

-- --- EVENTS -------------------------------------------------------------------
drop policy if exists "events_select_visible" on public.events;
create policy "events_select_visible"
  on public.events for select to authenticated
  using (
    tipo = 'publico'
    or creador_id = auth.uid()
    or public.is_event_member(id, auth.uid())
  );

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
  on public.events for insert to authenticated
  with check (creador_id = auth.uid());

drop policy if exists "events_update_creator" on public.events;
create policy "events_update_creator"
  on public.events for update to authenticated
  using (creador_id = auth.uid()) with check (creador_id = auth.uid());

drop policy if exists "events_delete_creator" on public.events;
create policy "events_delete_creator"
  on public.events for delete to authenticated
  using (creador_id = auth.uid());

-- --- EVENT_MEMBERS ------------------------------------------------------------
drop policy if exists "event_members_select_visible" on public.event_members;
create policy "event_members_select_visible"
  on public.event_members for select to authenticated
  using (public.can_view_event(event_id));

-- Apuntarse uno mismo a un evento público, o el creador invita a quien quiera.
drop policy if exists "event_members_insert" on public.event_members;
create policy "event_members_insert"
  on public.event_members for insert to authenticated
  with check (
    (usuario_id = auth.uid() and public.event_is_public(event_id))
    or public.event_creator(event_id) = auth.uid()
  );

-- Salir uno mismo, o el creador expulsa.
drop policy if exists "event_members_delete" on public.event_members;
create policy "event_members_delete"
  on public.event_members for delete to authenticated
  using (usuario_id = auth.uid() or public.event_creator(event_id) = auth.uid());

-- --- TEAMS --------------------------------------------------------------------
drop policy if exists "teams_select_visible" on public.teams;
create policy "teams_select_visible"
  on public.teams for select to authenticated
  using (public.can_view_event(event_id));

-- Cualquier miembro (o el creador) del evento puede crear/gestionar equipos.
drop policy if exists "teams_insert_member" on public.teams;
create policy "teams_insert_member"
  on public.teams for insert to authenticated
  with check (
    public.is_event_member(event_id, auth.uid())
    or public.event_creator(event_id) = auth.uid()
  );

drop policy if exists "teams_delete_member" on public.teams;
create policy "teams_delete_member"
  on public.teams for delete to authenticated
  using (
    public.is_event_member(event_id, auth.uid())
    or public.event_creator(event_id) = auth.uid()
  );

-- --- TEAM_MEMBERS -------------------------------------------------------------
drop policy if exists "team_members_select_visible" on public.team_members;
create policy "team_members_select_visible"
  on public.team_members for select to authenticated
  using (public.can_view_event(public.team_event_id(team_id)));

-- Unirse uno mismo a un equipo de un evento del que es miembro.
drop policy if exists "team_members_insert_self" on public.team_members;
create policy "team_members_insert_self"
  on public.team_members for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and public.is_event_member(public.team_event_id(team_id), auth.uid())
  );

-- Salir uno mismo, o el creador del evento gestiona.
drop policy if exists "team_members_delete" on public.team_members;
create policy "team_members_delete"
  on public.team_members for delete to authenticated
  using (
    usuario_id = auth.uid()
    or public.event_creator(public.team_event_id(team_id)) = auth.uid()
  );

-- =============================================================================
-- POLÍTICAS ADICIONALES en tablas existentes: "diario compartido" del evento.
-- Las consumiciones y posts ASOCIADOS a un evento son visibles para quienes
-- pueden ver el evento (además de las reglas personales/de amistad ya creadas).
-- =============================================================================
drop policy if exists "consumption_select_event" on public.consumption_logs;
create policy "consumption_select_event"
  on public.consumption_logs for select to authenticated
  using (evento_id is not null and public.can_view_event(evento_id));

drop policy if exists "posts_select_event" on public.posts;
create policy "posts_select_event"
  on public.posts for select to authenticated
  using (evento_id is not null and public.can_view_event(evento_id));

-- =============================================================================
-- TRIGGER: al crear un evento, el creador se añade como miembro (rol creador).
-- =============================================================================
create or replace function public.handle_new_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.event_members (event_id, usuario_id, rol)
  values (new.id, new.creador_id, 'creador')
  on conflict (event_id, usuario_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_event_created on public.events;
create trigger on_event_created
  after insert on public.events
  for each row execute function public.handle_new_event();

-- =============================================================================
-- REALTIME: participación y equipos en vivo.
-- =============================================================================
do $$
declare
  t text;
begin
  foreach t in array array['events', 'event_members', 'teams', 'team_members'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
