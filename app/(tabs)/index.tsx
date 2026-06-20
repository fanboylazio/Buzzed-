/**
 * Pantalla "Feed" — home social (Fase 2).
 *
 * Muestra las publicaciones propias y de los amigos (foto + texto), con likes
 * y acceso a comentarios. Se actualiza en vivo con Realtime y permite crear una
 * publicación nueva.
 */
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/context/AuthProvider';
import { useFeed, useToggleLike, useDeletePost } from '@/hooks/useFeed';
import { useFeedRealtime } from '@/hooks/useFeedRealtime';
import { colors, spacing, fontSize, radius, fonts } from '@/theme/colors';
import type { FeedPost } from '@/types/database';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const feed = useFeed();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  // Suscripción en vivo al feed.
  useFeedRealtime();

  const confirmDelete = useCallback(
    (post: FeedPost) => {
      Alert.alert('Borrar publicación', '¿Seguro que quieres borrarla?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () =>
            deletePost.mutate({ postId: post.id, fotoPath: post.foto_path }),
        },
      ]);
    },
    [deletePost],
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <PostCard
        post={item}
        isOwn={item.autor_id === user?.id}
        onToggleLike={() =>
          toggleLike.mutate({ postId: item.id, likedByMe: item.likedByMe })
        }
        onPressComments={() => router.push(`/post/${item.id}`)}
        onDelete={() => confirmDelete(item)}
      />
    ),
    [user?.id, toggleLike, router, confirmDelete],
  );

  return (
    <Screen padded={false}>
      {/* Cabecera */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Buzzed</Text>
        <Pressable
          style={styles.newBtn}
          onPress={() => router.push('/post/new')}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color={colors.background} />
        </Pressable>
      </View>

      {feed.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : feed.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            No se pudo cargar el feed. Revisa tu conexión y la configuración de Supabase.
          </Text>
        </View>
      ) : (
        <FlatList
          data={feed.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feed.isRefetching}
              onRefresh={feed.refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="beer-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>Tu feed está vacío</Text>
              <Text style={styles.emptyText}>
                Comparte tu primera copa o añade amigos para ver sus publicaciones.
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push('/post/new')}
              >
                <Text style={styles.emptyBtnText}>Crear publicación</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontFamily: fonts.extrabold,
    letterSpacing: -0.5,
  },
  newBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
