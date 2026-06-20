/**
 * Hooks de eventos (Fase 3): listar, ver, crear, apuntarse/salir y borrar.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type {
  EventRow,
  EventType,
  EventMemberWithProfile,
  ProfileSummary,
} from '@/types/database';

export const eventsKey = (userId: string | undefined) => ['events', userId] as const;
export const eventKey = (eventId: string) => ['event', eventId] as const;
export const eventMembersKey = (eventId: string) => ['event-members', eventId] as const;

/** Evento de la lista con métricas y si participo. */
export type EventListItem = EventRow & {
  memberCount: number;
  amMember: boolean;
  isActive: boolean;
};

/** ¿Está el evento activo ahora? (empezado y sin terminar) */
function computeActive(ev: EventRow, now: Date): boolean {
  const started = new Date(ev.fecha_inicio).getTime() <= now.getTime();
  const ended = ev.fecha_fin ? new Date(ev.fecha_fin).getTime() < now.getTime() : false;
  return started && !ended;
}

/** Lista de eventos visibles para el usuario. */
export function useEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: eventsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<EventListItem[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_members ( usuario_id )')
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const me = user!.id;
      type Row = EventRow & { event_members: { usuario_id: string }[] };
      return ((data ?? []) as unknown as Row[]).map((ev) => ({
        ...ev,
        memberCount: ev.event_members?.length ?? 0,
        amMember: (ev.event_members ?? []).some((m) => m.usuario_id === me),
        isActive: computeActive(ev, now),
      }));
    },
  });
}

/** Detalle de un evento (con perfil del creador). */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKey(eventId),
    enabled: !!eventId,
    queryFn: async (): Promise<
      (EventRow & { creador: ProfileSummary | null }) | null
    > => {
      const { data, error } = await supabase
        .from('events')
        .select('*, creador:profiles!events_creador_id_fkey ( id, username, avatar_url )')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as
        | (EventRow & { creador: ProfileSummary | null })
        | null;
    },
  });
}

/** Participantes de un evento (con perfil). */
export function useEventMembers(eventId: string) {
  return useQuery({
    queryKey: eventMembersKey(eventId),
    enabled: !!eventId,
    queryFn: async (): Promise<EventMemberWithProfile[]> => {
      const { data, error } = await supabase
        .from('event_members')
        .select('*, usuario:profiles!event_members_usuario_id_fkey ( id, username, avatar_url )')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as EventMemberWithProfile[];
    },
  });
}

interface CreateEventInput {
  nombre: string;
  descripcion?: string;
  tipo: EventType;
  fecha_inicio?: string;
  fecha_fin?: string | null;
}

/** Crea un evento (el trigger añade al creador como miembro). */
export function useCreateEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventInput): Promise<string> => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { data, error } = await supabase
        .from('events')
        .insert({
          nombre: input.nombre.trim(),
          descripcion: input.descripcion?.trim() || null,
          tipo: input.tipo,
          fecha_inicio: input.fecha_inicio ?? new Date().toISOString(),
          fecha_fin: input.fecha_fin ?? null,
          creador_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsKey(user?.id) });
    },
  });
}

/** Apuntarse a un evento (público). */
export function useJoinEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { error } = await supabase
        .from('event_members')
        .insert({ event_id: eventId, usuario_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_d, eventId) => {
      qc.invalidateQueries({ queryKey: eventsKey(user?.id) });
      qc.invalidateQueries({ queryKey: eventMembersKey(eventId) });
    },
  });
}

/** Salir de un evento. */
export function useLeaveEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { error } = await supabase
        .from('event_members')
        .delete()
        .eq('event_id', eventId)
        .eq('usuario_id', user.id);
      if (error) throw error;
    },
    onSuccess: (_d, eventId) => {
      qc.invalidateQueries({ queryKey: eventsKey(user?.id) });
      qc.invalidateQueries({ queryKey: eventMembersKey(eventId) });
    },
  });
}

/** Borra un evento (solo el creador). */
export function useDeleteEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsKey(user?.id) });
    },
  });
}
