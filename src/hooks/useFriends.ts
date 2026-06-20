/**
 * Hooks de amistades: formar el grupo mediante solicitud + aceptación.
 *
 * Se carga UNA sola consulta con todas mis amistades (cualquier estado) y de
 * ahí se derivan: amigos, solicitudes recibidas y solicitudes enviadas.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { Friendship, ProfileSummary } from '@/types/database';

export const friendshipsKey = (userId: string | undefined) =>
  ['friendships', userId] as const;

/** Amistad con los perfiles de ambos extremos resueltos. */
export type FriendshipWithProfiles = Friendship & {
  requester: ProfileSummary;
  addressee: ProfileSummary;
};

/** Carga todas las amistades en las que participo (cualquier estado). */
export function useMyFriendships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: friendshipsKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<FriendshipWithProfiles[]> => {
      const { data, error } = await supabase
        .from('friendships')
        .select(
          `*,
           requester:profiles!friendships_requester_id_fkey ( id, username, avatar_url ),
           addressee:profiles!friendships_addressee_id_fkey ( id, username, avatar_url )`,
        )
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as FriendshipWithProfiles[];
    },
  });
}

/** Derivaciones útiles a partir de la lista de amistades. */
export function useFriendsDerived() {
  const { user } = useAuth();
  const query = useMyFriendships();
  const me = user?.id;

  const derived = useMemo(() => {
    const all = query.data ?? [];
    const friends: ProfileSummary[] = [];
    const incoming: FriendshipWithProfiles[] = []; // solicitudes que me han enviado
    const outgoing: FriendshipWithProfiles[] = []; // solicitudes que he enviado
    // Mapa userId -> estado de relación, para pintar resultados de búsqueda.
    const statusByUser = new Map<string, 'amigo' | 'recibida' | 'enviada'>();
    // Mapa userId (del otro) -> id de la amistad, para poder eliminarla.
    const friendshipIdByUser = new Map<string, string>();

    for (const f of all) {
      const other = f.requester_id === me ? f.addressee : f.requester;
      friendshipIdByUser.set(other.id, f.id);
      if (f.status === 'aceptada') {
        friends.push(other);
        statusByUser.set(other.id, 'amigo');
      } else if (f.status === 'pendiente') {
        if (f.addressee_id === me) {
          incoming.push(f);
          statusByUser.set(f.requester_id, 'recibida');
        } else {
          outgoing.push(f);
          statusByUser.set(f.addressee_id, 'enviada');
        }
      }
    }
    return { friends, incoming, outgoing, statusByUser, friendshipIdByUser };
  }, [query.data, me]);

  return { ...query, ...derived };
}

/** Busca usuarios por nombre de usuario (para añadir amigos). */
export function useSearchUsers(term: string) {
  const { user } = useAuth();
  const cleaned = term.trim();
  return useQuery({
    queryKey: ['search-users', cleaned],
    enabled: cleaned.length >= 2,
    queryFn: async (): Promise<ProfileSummary[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${cleaned}%`)
        .neq('id', user!.id)
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Envía una solicitud de amistad a otro usuario. */
export function useSendFriendRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const { error } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: 'pendiente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendshipsKey(user?.id) });
    },
  });
}

/** Acepta una solicitud de amistad recibida. */
export function useAcceptFriendRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'aceptada', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendshipsKey(user?.id) });
    },
  });
}

/**
 * Elimina una amistad o solicitud por id (sirve para rechazar una solicitud,
 * cancelar una enviada o eliminar a un amigo).
 */
export function useRemoveFriendship() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: friendshipsKey(user?.id) });
    },
  });
}
