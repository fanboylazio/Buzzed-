/**
 * Datos del "diario compartido" de un evento (Fase 3).
 *
 * Principio de producto: es un registro INFORMATIVO de las consumiciones
 * asociadas al evento (por persona y por equipo). No es un marcador competitivo
 * ni premia consumir más.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventConsumption } from '@/types/database';

export const eventConsumptionsKey = (eventId: string) =>
  ['event-consumptions', eventId] as const;

/** Consumiciones asociadas a un evento, con usuario y tipo de bebida. */
export function useEventConsumptions(eventId: string) {
  return useQuery({
    queryKey: eventConsumptionsKey(eventId),
    enabled: !!eventId,
    queryFn: async (): Promise<EventConsumption[]> => {
      const { data, error } = await supabase
        .from('consumption_logs')
        .select(
          `id, usuario_id, drink_type_id, cantidad, created_at,
           usuario:profiles!consumption_logs_usuario_id_fkey ( id, username, avatar_url ),
           drink_type:drink_types ( id, slug, nombre, icono )`,
        )
        .eq('evento_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as EventConsumption[];
    },
  });
}
