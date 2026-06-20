/**
 * Hook para leer el catálogo de tipos de consumición (copa, cóctel, etc.).
 * El catálogo es estático/compartido, así que se cachea con largo staleTime.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DrinkType } from '@/types/database';

export const drinkTypesKey = ['drink_types'] as const;

export function useDrinkTypes() {
  return useQuery({
    queryKey: drinkTypesKey,
    staleTime: 1000 * 60 * 60, // 1h: el catálogo casi nunca cambia
    queryFn: async (): Promise<DrinkType[]> => {
      const { data, error } = await supabase
        .from('drink_types')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
