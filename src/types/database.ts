/**
 * Tipos de la base de datos (Supabase / Postgres).
 *
 * Tipado a mano para Fase 1 (las tablas avanzadas se incluyen para que el
 * cliente quede preparado, pero la app solo usa profiles, drink_types y
 * consumption_logs en esta fase). En el futuro se puede regenerar con:
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
        Insert: Omit<EventRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<EventRow>;
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
