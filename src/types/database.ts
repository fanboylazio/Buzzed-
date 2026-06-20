/**
 * Tipos de la base de datos (Supabase / Postgres).
 *
 * Tipado a mano. Cubre Fase 1 (profiles, drink_types, consumption_logs) y
 * Fase 2 (friendships, posts, post_likes, post_comments). En el futuro se
 * puede regenerar con:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 */

/** Tipo de evento. */
export type EventType = 'publico' | 'privado';

/** Tipo de equipo dentro de un evento. */
export type TeamType = 'individual' | 'pareja' | 'trio' | 'equipo';

/** Estado de una solicitud de amistad. */
export type FriendshipStatus = 'pendiente' | 'aceptada' | 'bloqueada';

/** Clave de un tipo de consumición del catálogo. */
export type DrinkSlug = 'copa' | 'coctel' | 'cerveza' | 'chupito' | 'cigarro';

// NOTA: estas entidades se declaran como `type` (no `interface`) a propósito.
// supabase-js exige que las filas sean asignables a `Record<string, unknown>`,
// y los alias de tipo cumplen esa restricción mientras que las interfaces no.

export type Profile = {
  id: string; // = auth.users.id
  username: string;
  avatar_url: string | null;
  birthdate: string | null; // ISO date (gate +18)
  created_at: string;
};

export type DrinkType = {
  id: number;
  slug: DrinkSlug;
  nombre: string;
  icono: string; // nombre de icono (Ionicons) o emoji
  unidad_referencia: string | null; // p. ej. "33cl", "4cl"
  orden: number;
};

export type ConsumptionLog = {
  id: string;
  usuario_id: string;
  evento_id: string | null;
  drink_type_id: number;
  cantidad: number;
  nota: string | null;
  created_at: string; // timestamp del registro
};

/** Igual que ConsumptionLog pero con el tipo de bebida resuelto (join). */
export type ConsumptionLogWithDrink = ConsumptionLog & {
  drink_type: DrinkType;
};

export type EventRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: EventType;
  fecha_inicio: string;
  fecha_fin: string | null;
  creador_id: string;
  portada_url: string | null;
  created_at: string;
};

// --- Fase 2: amistades y feed social ---------------------------------------

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  autor_id: string;
  evento_id: string | null;
  foto_path: string; // ruta en Storage (se firma para obtener la URL)
  texto: string | null;
  created_at: string;
};

export type PostLike = {
  post_id: string;
  usuario_id: string;
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  autor_id: string;
  texto: string;
  created_at: string;
};

/** Resumen de perfil para listas (amigos, autores, etc.). */
export type ProfileSummary = Pick<Profile, 'id' | 'username' | 'avatar_url'>;

/** Publicación enriquecida para el feed (autor + métricas calculadas). */
export type FeedPost = Post & {
  autor: ProfileSummary;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  /** URL firmada lista para mostrar la imagen (se resuelve aparte). */
  fotoUrl?: string | null;
};

/** Comentario con su autor resuelto. */
export type CommentWithAuthor = PostComment & {
  autor: ProfileSummary;
};

// --- Fase 3: eventos, equipos y participación -------------------------------

export type EventMember = {
  id: string;
  event_id: string;
  usuario_id: string;
  rol: 'creador' | 'miembro';
  created_at: string;
};

export type Team = {
  id: string;
  event_id: string;
  nombre: string;
  tipo: TeamType;
  created_at: string;
};

export type TeamMember = {
  team_id: string;
  usuario_id: string;
  created_at: string;
};

/** Participante de un evento con su perfil resuelto. */
export type EventMemberWithProfile = EventMember & {
  usuario: ProfileSummary;
};

/** Equipo con sus miembros (perfiles resueltos). */
export type TeamWithMembers = Team & {
  miembros: ProfileSummary[];
};

/** Fila de "diario compartido": consumición de un evento con usuario y bebida. */
export type EventConsumption = {
  id: string;
  usuario_id: string;
  drink_type_id: number;
  cantidad: number;
  created_at: string;
  usuario: ProfileSummary;
  drink_type: { id: number; slug: DrinkSlug; nombre: string; icono: string };
};

/**
 * Tipo "Database" en el formato que espera supabase-js.
 * Solo se detallan las tablas usadas en Fase 1; el resto puede ampliarse.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      drink_types: {
        Row: DrinkType;
        Insert: Omit<DrinkType, 'id'> & { id?: number };
        Update: Partial<DrinkType>;
        Relationships: [];
      };
      consumption_logs: {
        Row: ConsumptionLog;
        Insert: Omit<ConsumptionLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ConsumptionLog>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Omit<
          EventRow,
          | 'id'
          | 'created_at'
          | 'descripcion'
          | 'tipo'
          | 'fecha_inicio'
          | 'fecha_fin'
          | 'portada_url'
        > & {
          id?: string;
          created_at?: string;
          descripcion?: string | null;
          tipo?: EventType;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          portada_url?: string | null;
        };
        Update: Partial<EventRow>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Friendship>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'evento_id' | 'texto'> & {
          id?: string;
          created_at?: string;
          evento_id?: string | null;
          texto?: string | null;
        };
        Update: Partial<Post>;
        Relationships: [];
      };
      post_likes: {
        Row: PostLike;
        Insert: Omit<PostLike, 'created_at'> & { created_at?: string };
        Update: Partial<PostLike>;
        Relationships: [];
      };
      post_comments: {
        Row: PostComment;
        Insert: Omit<PostComment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<PostComment>;
        Relationships: [];
      };
      event_members: {
        Row: EventMember;
        Insert: Omit<EventMember, 'id' | 'created_at' | 'rol'> & {
          id?: string;
          created_at?: string;
          rol?: 'creador' | 'miembro';
        };
        Update: Partial<EventMember>;
        Relationships: [];
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'tipo'> & {
          id?: string;
          created_at?: string;
          tipo?: TeamType;
        };
        Update: Partial<Team>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'created_at'> & { created_at?: string };
        Update: Partial<TeamMember>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_type: EventType;
      team_type: TeamType;
      friendship_status: FriendshipStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
