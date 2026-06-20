-- =============================================================================
-- Buzzed · Migración Fase 1 (MVP)
-- -----------------------------------------------------------------------------
-- Crea las tablas necesarias para el MVP: perfiles, catálogo de bebidas y
-- registro de consumiciones. Activa Row Level Security (RLS) para que cada
-- usuario solo acceda a lo suyo. Incluye trigger de creación de perfil y la
-- semilla del catálogo de bebidas.
--
-- Las entidades avanzadas (friendships, events, teams, posts, ...) se añadirán
-- en migraciones de fases posteriores.
-- =============================================================================

-- Extensión para UUIDs (suele venir ya instalada en Supabase).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- PROFILES: perfil público de cada usuario, vinculado a auth.users.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique,
  avatar_url  text,
  birthdate   date,                 -- usado por el gate +18
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público de cada usuario (vinculado a auth.users).';

-- -----------------------------------------------------------------------------
-- DRINK_TYPES: catálogo de tipos de consumición (copa, cóctel, etc.).
-- Compartido por todos; de solo lectura para los usuarios.
-- -----------------------------------------------------------------------------
create table if not exists public.drink_types (
  id                 serial primary key,
  slug               text not null unique,   -- copa | coctel | cerveza | chupito | cigarro
  nombre             text not null,
  icono              text not null,          -- emoji o nombre de icono
  unidad_referencia  text,                   -- p. ej. "33cl", "4cl"
  orden              int not null default 0  -- orden de aparición en la rejilla
);

comment on table public.drink_types is 'Catálogo de tipos de consumición.';

-- -----------------------------------------------------------------------------
-- CONSUMPTION_LOGS: registro central de consumiciones.
-- evento_id queda como uuid nullable (sin FK aún); la FK a events se añadirá
-- cuando exista la tabla de eventos (Fase 3).
-- -----------------------------------------------------------------------------
create table if not exists public.consumption_logs (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.profiles (id) on delete cascade,
  evento_id      uuid,
  drink_type_id  int not null references public.drink_types (id),
  cantidad       int not null default 1 check (cantidad > 0),
  nota           text,
  created_at     timestamptz not null default now()
);

comment on table public.consumption_logs is 'Registro central de consumiciones de cada usuario.';

-- Índices para consultas habituales (por usuario y por fecha).
create index if not exists idx_consumption_logs_usuario
  on public.consumption_logs (usuario_id, created_at desc);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.drink_types      enable row level security;
alter table public.consumption_logs enable row level security;

-- --- PROFILES -----------------------------------------------------------------
-- Lectura: cualquier usuario autenticado puede ver perfiles (app privada del
-- grupo; el filtrado por "amigos" se afinará en la fase de amistades).
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Actualización: solo el propio perfil.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserción: solo el propio perfil (respaldo; normalmente lo crea el trigger).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- --- DRINK_TYPES --------------------------------------------------------------
-- Catálogo de solo lectura para usuarios autenticados.
drop policy if exists "drink_types_select_all" on public.drink_types;
create policy "drink_types_select_all"
  on public.drink_types for select
  to authenticated
  using (true);

-- --- CONSUMPTION_LOGS ---------------------------------------------------------
-- Cada usuario solo ve y gestiona SUS registros.
drop policy if exists "consumption_select_own" on public.consumption_logs;
create policy "consumption_select_own"
  on public.consumption_logs for select
  to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "consumption_insert_own" on public.consumption_logs;
create policy "consumption_insert_own"
  on public.consumption_logs for insert
  to authenticated
  with check (auth.uid() = usuario_id);

drop policy if exists "consumption_update_own" on public.consumption_logs;
create policy "consumption_update_own"
  on public.consumption_logs for update
  to authenticated
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

drop policy if exists "consumption_delete_own" on public.consumption_logs;
create policy "consumption_delete_own"
  on public.consumption_logs for delete
  to authenticated
  using (auth.uid() = usuario_id);

-- =============================================================================
-- TRIGGER: crear perfil automáticamente al registrarse un usuario.
-- Lee username y birthdate de los metadatos enviados en el alta (signUp).
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, birthdate)
  values (
    new.id,
    -- Si no llega username, generamos uno provisional a partir del id.
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    (new.raw_user_meta_data ->> 'birthdate')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- SEED: catálogo de bebidas (idempotente gracias a "on conflict").
-- =============================================================================
insert into public.drink_types (slug, nombre, icono, unidad_referencia, orden) values
  ('cerveza', 'Cerveza', '🍺', '33cl', 1),
  ('copa',    'Copa',    '🍷', null,   2),
  ('coctel',  'Cóctel',  '🍹', null,   3),
  ('chupito', 'Chupito', '🥃', '4cl',  4),
  ('cigarro', 'Cigarro', '🚬', null,   5)
on conflict (slug) do update
  set nombre = excluded.nombre,
      icono = excluded.icono,
      unidad_referencia = excluded.unidad_referencia,
      orden = excluded.orden;
