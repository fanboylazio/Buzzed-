-- =============================================================================
-- Buzzed · Migración Fase 2 (Amigos + Feed social)
-- -----------------------------------------------------------------------------
-- Añade amistades (solicitud/aceptación) y el feed social con fotos, likes y
-- comentarios. Activa RLS para que cada usuario solo vea lo suyo y lo de sus
-- amigos. Crea un bucket de Storage PRIVADO para las fotos (se sirven mediante
-- URLs firmadas) y habilita Realtime en las tablas del feed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FRIENDSHIPS: relación de amistad entre dos usuarios.
-- requester_id = quien envía la solicitud, addressee_id = quien la recibe.
-- -----------------------------------------------------------------------------
create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pendiente'
                  check (status in ('pendiente', 'aceptada', 'bloqueada')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint friendship_distinct check (requester_id <> addressee_id),
  constraint friendship_unique unique (requester_id, addressee_id)
);

comment on table public.friendships is 'Solicitudes y relaciones de amistad (forman el grupo).';

create index if not exists idx_friendships_addressee
  on public.friendships (addressee_id, status);
create index if not exists idx_friendships_requester
  on public.friendships (requester_id, status);

-- -----------------------------------------------------------------------------
-- POSTS: publicaciones del feed (foto obligatoria + texto opcional).
-- foto_path guarda la RUTA en Storage; el cliente genera una URL firmada.
-- evento_id queda nullable (sin FK aún; la FK a events llega en Fase 3).
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  autor_id    uuid not null references public.profiles (id) on delete cascade,
  evento_id   uuid,
  foto_path   text not null,
  texto       text,
  created_at  timestamptz not null default now()
);

comment on table public.posts is 'Publicaciones del feed social (foto + texto).';

create index if not exists idx_posts_autor_fecha
  on public.posts (autor_id, created_at desc);

-- -----------------------------------------------------------------------------
-- POST_LIKES y POST_COMMENTS: interacción social.
-- -----------------------------------------------------------------------------
create table if not exists public.post_likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  usuario_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, usuario_id)
);

comment on table public.post_likes is 'Likes de las publicaciones.';

create table if not exists public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  autor_id    uuid not null references public.profiles (id) on delete cascade,
  texto       text not null check (length(trim(texto)) > 0),
  created_at  timestamptz not null default now()
);

comment on table public.post_comments is 'Comentarios de las publicaciones.';

create index if not exists idx_post_comments_post
  on public.post_comments (post_id, created_at);

-- =============================================================================
-- FUNCIONES DE VISIBILIDAD (security definer para evitar recursión en RLS).
-- =============================================================================

-- ¿Son amigos (amistad aceptada) los usuarios a y b? Relación simétrica.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'aceptada'
      and (
        (f.requester_id = a and f.addressee_id = b) or
        (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

-- ¿Puede el usuario actual ver esta publicación? (es suya o del autor es amigo)
create or replace function public.can_view_post(p_post uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post
      and (p.autor_id = auth.uid() or public.are_friends(auth.uid(), p.autor_id))
  );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.friendships   enable row level security;
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;
alter table public.post_comments enable row level security;

-- --- FRIENDSHIPS --------------------------------------------------------------
-- Ver solo las amistades en las que participo.
drop policy if exists "friendships_select_involved" on public.friendships;
create policy "friendships_select_involved"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Crear solicitud: yo soy el solicitante y empieza como pendiente.
drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id and status = 'pendiente');

-- Actualizar (aceptar/rechazar/bloquear): cualquiera de los dos implicados.
drop policy if exists "friendships_update_involved" on public.friendships;
create policy "friendships_update_involved"
  on public.friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Borrar (cancelar solicitud / eliminar amigo): cualquiera de los dos.
drop policy if exists "friendships_delete_involved" on public.friendships;
create policy "friendships_delete_involved"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- --- POSTS --------------------------------------------------------------------
drop policy if exists "posts_select_friends" on public.posts;
create policy "posts_select_friends"
  on public.posts for select
  to authenticated
  using (auth.uid() = autor_id or public.are_friends(auth.uid(), autor_id));

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = autor_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = autor_id)
  with check (auth.uid() = autor_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = autor_id);

-- --- POST_LIKES ---------------------------------------------------------------
drop policy if exists "likes_select_visible" on public.post_likes;
create policy "likes_select_visible"
  on public.post_likes for select
  to authenticated
  using (public.can_view_post(post_id));

drop policy if exists "likes_insert_own" on public.post_likes;
create policy "likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = usuario_id and public.can_view_post(post_id));

drop policy if exists "likes_delete_own" on public.post_likes;
create policy "likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = usuario_id);

-- --- POST_COMMENTS ------------------------------------------------------------
drop policy if exists "comments_select_visible" on public.post_comments;
create policy "comments_select_visible"
  on public.post_comments for select
  to authenticated
  using (public.can_view_post(post_id));

drop policy if exists "comments_insert_own" on public.post_comments;
create policy "comments_insert_own"
  on public.post_comments for insert
  to authenticated
  with check (auth.uid() = autor_id and public.can_view_post(post_id));

drop policy if exists "comments_delete_own" on public.post_comments;
create policy "comments_delete_own"
  on public.post_comments for delete
  to authenticated
  using (auth.uid() = autor_id);

-- =============================================================================
-- STORAGE: bucket PRIVADO para las fotos del feed.
-- Las fotos se guardan en "post-photos/{autor_id}/{uuid}.jpg" y se sirven con
-- URLs firmadas. La política de SELECT controla quién puede firmar una URL
-- (el autor y sus amigos), manteniendo la privacidad del grupo.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false)
on conflict (id) do nothing;

-- Subir: solo a tu propia carpeta ({autor_id}/...).
drop policy if exists "post_photos_insert_own" on storage.objects;
create policy "post_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ver / firmar URL: el dueño de la carpeta o sus amigos.
drop policy if exists "post_photos_select_friends" on storage.objects;
create policy "post_photos_select_friends"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.are_friends(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

-- Borrar: solo tus propias fotos.
drop policy if exists "post_photos_delete_own" on storage.objects;
create policy "post_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- REALTIME: habilitar replicación en las tablas del feed para actualizaciones
-- en vivo. Se añade cada tabla solo si no estaba ya en la publicación.
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_likes'
  ) then
    alter publication supabase_realtime add table public.post_likes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_comments'
  ) then
    alter publication supabase_realtime add table public.post_comments;
  end if;
end $$;
