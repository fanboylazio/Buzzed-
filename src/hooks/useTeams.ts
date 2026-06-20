/**
 * Hooks de equipos dentro de un evento (Fase 3).
 *
 * Cada usuario pertenece como mucho a un equipo por evento: al unirse a uno se
 * le saca automáticamente de los demás equipos del mismo evento.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { TeamType, TeamWithMembers, ProfileSummary } from '@/types/database';

export const teamsKey = (eventId: string) => ['teams', eventId] as const;

/** Equipos de un evento con sus miembros. */
export function useEventTeams(eventId: string) {
  return useQuery({
    queryKey: teamsKey(eventId),
    enabled: !!eventId,
    queryFn: async (): Promise<TeamWithMembers[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select(
          `id, event_id, nombre, tipo, created_at,
           team_members ( usuario:profiles!team_members_usuario_id_fkey ( id, username, avatar_url ) )`,
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      type Row = {
        id: string;
        event_id: string;
        nombre: string;
        tipo: TeamType;
        created_at: string;
        team_members: { usuario: ProfileSummary }[];
      };
      return ((data ?? []) as unknown as Row[]).map((t) => ({
        id: t.id,
        event_id: t.event_id,
        nombre: t.nombre,
        tipo: t.tipo,
        created_at: t.created_at,
        miembros: (t.team_members ?? []).map((tm) => tm.usuario),
      }));
    },
  });
}

/** Crea un equipo en un evento. */
export function useCreateTeam(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nombre, tipo }: { nombre: string; tipo: TeamType }) => {
      const { error } = await supabase
        .from('teams')
        .insert({ event_id: eventId, nombre: nombre.trim(), tipo });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamsKey(eventId) });
    },
  });
}

/** Une al usuario a un equipo (saliendo antes de los demás del evento). */
export function useJoinTeam(eventId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      otherTeamIds,
    }: {
      teamId: string;
      otherTeamIds: string[];
    }) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      // Salgo de cualquier otro equipo del mismo evento.
      if (otherTeamIds.length > 0) {
        const { error: delError } = await supabase
          .from('team_members')
          .delete()
          .eq('usuario_id', user.id)
          .in('team_id', otherTeamIds);
        if (delError) throw delError;
      }
      const { error } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, usuario_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamsKey(eventId) });
    },
  });
}

/** Saca al usuario de un equipo. */
export function useLeaveTeam(eventId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('usuario_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamsKey(eventId) });
    },
  });
}

/** Borra un equipo entero. */
export function useDeleteTeam(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamsKey(eventId) });
    },
  });
}
