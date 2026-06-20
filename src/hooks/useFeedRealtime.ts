/**
 * Suscripción Realtime del feed.
 *
 * Escucha cambios en posts, likes y comentarios y refresca la caché de React
 * Query para que el feed se actualice en vivo sin recargar a mano.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { feedKey } from '@/hooks/useFeed';

export function useFeedRealtime() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const invalidateFeed = () =>
      qc.invalidateQueries({ queryKey: feedKey(user.id) });

    const channel = supabase
      .channel('feed-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        invalidateFeed,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        invalidateFeed,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_comments' },
        // Refrescamos el feed (contador de comentarios) y, si hay detalle
        // abierto, sus comentarios concretos.
        (payload) => {
          invalidateFeed();
          const postId =
            (payload.new as { post_id?: string })?.post_id ??
            (payload.old as { post_id?: string })?.post_id;
          if (postId) {
            qc.invalidateQueries({ queryKey: ['comments', postId] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);
}
