/**
 * Hooks de perfil: leer y actualizar el perfil del usuario autenticado.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { Profile } from '@/types/database';

export const profileKey = (userId: string | undefined) =>
  ['profile', userId] as const;

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: profileKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (changes: Partial<Pick<Profile, 'username' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { error } = await supabase
        .from('profiles')
        .update(changes)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKey(user?.id) });
    },
  });
}
