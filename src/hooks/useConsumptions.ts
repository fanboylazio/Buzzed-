/**
 * Hooks de consumiciones: registrar, listar, editar y borrar.
 *
 * El "registro de consumiciones" es el núcleo de Buzzed. Aquí se concentran
 * las mutaciones y las consultas relacionadas, invalidando la caché de
 * React Query para mantener la UI al día.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { ConsumptionLogWithDrink } from '@/types/database';

export const consumptionsKey = (userId: string | undefined) =>
  ['consumptions', userId] as const;

/** Lista las consumiciones del usuario (con el tipo de bebida resuelto). */
export function useConsumptions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: consumptionsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<ConsumptionLogWithDrink[]> => {
      const { data, error } = await supabase
        .from('consumption_logs')
        .select('*, drink_type:drink_types(*)')
        .eq('usuario_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ConsumptionLogWithDrink[];
    },
  });
}

interface AddConsumptionInput {
  drink_type_id: number;
  cantidad: number;
  evento_id?: string | null;
  nota?: string | null;
}

/** Registra una nueva consumición. */
export function useAddConsumption() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddConsumptionInput) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { data, error } = await supabase
        .from('consumption_logs')
        .insert({
          usuario_id: user.id,
          drink_type_id: input.drink_type_id,
          cantidad: input.cantidad,
          evento_id: input.evento_id ?? null,
          nota: input.nota ?? null,
        })
        .select('*, drink_type:drink_types(*)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consumptionsKey(user?.id) });
    },
  });
}

/** Borra una consumición propia (reciente). */
export function useDeleteConsumption() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('consumption_logs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consumptionsKey(user?.id) });
    },
  });
}

interface UpdateConsumptionInput {
  id: string;
  cantidad?: number;
  nota?: string | null;
}

/** Edita una consumición propia (cantidad o nota). */
export function useUpdateConsumption() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...changes }: UpdateConsumptionInput) => {
      const { error } = await supabase
        .from('consumption_logs')
        .update(changes)
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consumptionsKey(user?.id) });
    },
  });
}
