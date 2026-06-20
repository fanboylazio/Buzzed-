/**
 * Detalle de una publicación con sus comentarios (Fase 2).
 *
 * Reutiliza la publicación cacheada del feed y carga sus comentarios. Permite
 * dar like, comentar y borrar comentarios propios.
 */
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { timeAgo } from '@/lib/format';
import { useAuth } from '@/context/AuthProvider';
import { useFeed, useToggleLike } from '@/hooks/useFeed';
import {
  usePostComments,
  useAddComment,
  useDeleteComment,
} from '@/hooks/usePostComments';
import { colors, spacing, fontSize, radius } from '@/theme/colors';
import type { CommentWithAuthor } from '@/types/database';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = String(id);
  const { user } = useAuth();

  const feed = useFeed();
  const toggleLike = useToggleLike();
  const comments = usePostComments(postId);
  const addComment = useAddComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [texto, setTexto] = useState('');

  // Recuperamos la publicación desde la caché del feed.
  const post = useMemo(
    () => (feed.data ?? []).find((p) => p.id === postId),
    [feed.data, postId],
  );

  async function handleSend() {
    const clean = texto.trim();
    if (!clean) return;
    setTexto('');
    try {
      await addComment.mutateAsync(clean);
    } catch {
      setTexto(clean); // restauramos si falla
    }
  }

  const renderComment = ({ item }: { item: CommentWithAuthor }) => (
    <View style={styles.commentRow}>
      <Avatar username={item.autor.username} avatarUrl={item.autor.avatar_url} size={32} />
      <View style={styles.commentBody}>
        <Text style={styles.commentText}>
          <Text style={styles.commentAuthor}>{item.autor.username} </Text>
          {item.texto}
        </Text>
        <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {item.autor_id === user?.id ? (
        <Pressable onPress={() => deleteComment.mutate(item.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.flex}
      >
        <FlatList
          data={comments.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            post ? (
              <View style={styles.postHeader}>
                {/* Autor */}
                <View style={styles.authorRow}>
                  <Avatar
                    username={post.autor.username}
                    avatarUrl={post.autor.avatar_url}
                    size={40}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.username}>{post.autor.username}</Text>
                    <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
                  </View>
                </View>

                {/* Foto */}
                {post.fotoUrl ? (
                  <Image source={{ uri: post.fotoUrl }} style={styles.photo} />
                ) : null}

                {/* Like + texto */}
                <View style={styles.likeRow}>
                  <Pressable
                    onPress={() =>
                      toggleLike.mutate({ postId: post.id, likedByMe: post.likedByMe })
                    }
                    style={styles.likeBtn}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={post.likedByMe ? 'heart' : 'heart-outline'}
                      size={24}
                      color={post.likedByMe ? colors.danger : colors.text}
                    />
                    <Text style={styles.likeCount}>{post.likeCount}</Text>
                  </Pressable>
                </View>

                {post.texto ? (
                  <Text style={styles.caption}>
                    <Text style={styles.commentAuthor}>{post.autor.username} </Text>
                    {post.texto}
                  </Text>
                ) : null}

                <Text style={styles.commentsTitle}>Comentarios</Text>
              </View>
            ) : feed.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : null
          }
          ListEmptyComponent={
            comments.isLoading ? null : (
              <Text style={styles.empty}>Sé el primero en comentar.</Text>
            )
          }
        />

        {/* Caja para escribir comentario */}
        <View style={styles.composer}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Añade un comentario..."
            placeholderTextColor={colors.textFaint}
            style={styles.composerInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={!texto.trim() || addComment.isPending}
            style={[styles.sendBtn, !texto.trim() && styles.sendBtnDisabled]}
          >
            <Ionicons name="send" size={18} color={colors.background} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  postHeader: {
    gap: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  username: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  time: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likeCount: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  caption: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  commentsTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  commentBody: { flex: 1 },
  commentText: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  commentAuthor: {
    fontWeight: '700',
  },
  commentTime: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  empty: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    color: colors.text,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
