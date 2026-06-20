/**
 * Tarjeta de publicación en el feed: autor, foto, texto, likes y comentarios.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { timeAgo } from '@/lib/format';
import { colors, radius, spacing, fontSize } from '@/theme/colors';
import type { FeedPost } from '@/types/database';

interface PostCardProps {
  post: FeedPost;
  isOwn: boolean;
  onToggleLike: () => void;
  onPressComments: () => void;
  onDelete?: () => void;
}

export function PostCard({
  post,
  isOwn,
  onToggleLike,
  onPressComments,
  onDelete,
}: PostCardProps) {
  return (
    <View style={styles.card}>
      {/* Cabecera: autor + tiempo */}
      <View style={styles.header}>
        <Avatar username={post.autor.username} avatarUrl={post.autor.avatar_url} size={40} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{post.autor.username}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
        {isOwn && onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Foto */}
      {post.fotoUrl ? (
        <Image source={{ uri: post.fotoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Ionicons name="image-outline" size={36} color={colors.textFaint} />
        </View>
      )}

      {/* Acciones */}
      <View style={styles.actions}>
        <Pressable onPress={onToggleLike} hitSlop={8} style={styles.action}>
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={24}
            color={post.likedByMe ? colors.danger : colors.text}
          />
          <Text style={styles.actionText}>{post.likeCount}</Text>
        </Pressable>
        <Pressable onPress={onPressComments} hitSlop={8} style={styles.action}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>
      </View>

      {/* Texto opcional */}
      {post.texto ? (
        <Text style={styles.text}>
          <Text style={styles.textAuthor}>{post.autor.username} </Text>
          {post.texto}
        </Text>
      ) : null}

      {post.commentCount > 0 ? (
        <Pressable onPress={onPressComments}>
          <Text style={styles.viewComments}>
            Ver {post.commentCount === 1 ? 'el comentario' : `los ${post.commentCount} comentarios`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  headerText: { flex: 1 },
  username: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  time: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.surfaceAlt,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  text: {
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  textAuthor: {
    fontWeight: '700',
  },
  viewComments: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
});
