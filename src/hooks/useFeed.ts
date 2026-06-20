/**
 * Hooks del feed social (Fase 2): listar publicaciones, dar like y publicar.
 *
 * El feed muestra mis publicaciones y las de mis amigos (la visibilidad la
 * impone RLS). Las fotos se sirven con URLs firmadas generadas al vuelo.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { uploadPostPhoto, signPhotoUrls, deletePostPhoto } from '@/lib/storage';
import type { FeedPost, ProfileSummary } from '@/types/database';

export const feedKey = (userId: string | undefined) => ['feed', userId] as const;

/** Forma cruda que devuelve la consulta del feed antes de normalizar. */
type RawFeedRow = {
  id: string;
  autor_id: string;
  evento_id: string | null;
  foto_path: string;
  texto: string | null;
  created_at: string;
  autor: ProfileSummary;
  post_likes: { usuario_id: string }[];
  post_comments: { count: number }[];
};

/** Lista el feed visible para el usuario, con métricas y URLs firmadas. */
export function useFeed() {
  const { user } = useAuth();
  return useQuery({
    queryKey: feedKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<FeedPost[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `id, autor_id, evento_id, foto_path, texto, created_at,
           autor:profiles!posts_autor_id_fkey ( id, username, avatar_url ),
           post_likes ( usuario_id ),
           post_comments ( count )`,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as RawFeedRow[];
      const me = user!.id;

      // Normalizamos a FeedPost (métricas calculadas en cliente).
      const posts: FeedPost[] = rows.map((row) => ({
        id: row.id,
        autor_id: row.autor_id,
        evento_id: row.evento_id,
        foto_path: row.foto_path,
        texto: row.texto,
        created_at: row.created_at,
        autor: row.autor,
        likeCount: row.post_likes?.length ?? 0,
        likedByMe: (row.post_likes ?? []).some((l) => l.usuario_id === me),
        commentCount: row.post_comments?.[0]?.count ?? 0,
      }));

      // Firmamos todas las fotos en una sola llamada y las asociamos.
      const urlMap = await signPhotoUrls(posts.map((p) => p.foto_path));
      return posts.map((p) => ({ ...p, fotoUrl: urlMap[p.foto_path] ?? null }));
    },
  });
}

/** Da o quita like a una publicación (con actualización optimista). */
export function useToggleLike() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      likedByMe,
    }: {
      postId: string;
      likedByMe: boolean;
    }) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      if (likedByMe) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('usuario_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, usuario_id: user.id });
        if (error) throw error;
      }
    },
    // Optimista: actualizamos el contador y el estado del like al instante.
    onMutate: async ({ postId, likedByMe }) => {
      await qc.cancelQueries({ queryKey: feedKey(user?.id) });
      const prev = qc.getQueryData<FeedPost[]>(feedKey(user?.id));
      qc.setQueryData<FeedPost[]>(feedKey(user?.id), (old) =>
        (old ?? []).map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !likedByMe,
                likeCount: p.likeCount + (likedByMe ? -1 : 1),
              }
            : p,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(feedKey(user?.id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: feedKey(user?.id) });
    },
  });
}

/** Crea una publicación: sube la foto y guarda el post. */
export function useCreatePost() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ localUri, texto }: { localUri: string; texto?: string }) => {
      if (!user?.id) throw new Error('No hay sesión activa.');
      const fotoPath = await uploadPostPhoto(user.id, localUri);
      const { error } = await supabase.from('posts').insert({
        autor_id: user.id,
        foto_path: fotoPath,
        texto: texto?.trim() ? texto.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKey(user?.id) });
    },
  });
}

/** Borra una publicación propia (y su foto en Storage). */
export function useDeletePost() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, fotoPath }: { postId: string; fotoPath: string }) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      // Intentamos limpiar la foto; si falla no bloqueamos el borrado del post.
      try {
        await deletePostPhoto(fotoPath);
      } catch {
        // ignorado a propósito
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKey(user?.id) });
    },
  });
}
