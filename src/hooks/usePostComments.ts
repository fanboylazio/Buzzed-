/**
 * Hooks de comentarios de una publicación.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import type { CommentWithAuthor } from '@/types/database';

export const commentsKey = (postId: string) => ['comments', postId] as const;

/** Lista los comentarios de una publicación (orden cronológico). */
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: commentsKey(postId),
    enabled: !!postId,
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(
          `id, post_id, autor_id, texto, created_at,
           autor:profiles!post_comments_autor_id_fkey ( id, username, avatar_url )`,
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as CommentWithAuthor[];
    },
  });
}

/** Añade un comentario a una publicación. */
export function useAddComment(postId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (texto: string) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const clean = texto.trim();
      if (!clean) throw new Error('El comentario está vacío.');
      const { error } = await supabase.from('post_comments').insert({
        post_id: postId,
        autor_id: user.id,
        texto: clean,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      qc.invalidateQueries({ queryKey: ['feed', user?.id] });
    },
  });
}

/** Borra un comentario propio. */
export function useDeleteComment(postId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      qc.invalidateQueries({ queryKey: ['feed', user?.id] });
    },
  });
}
