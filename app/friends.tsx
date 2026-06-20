/**
 * Pantalla de Amigos (Fase 2).
 *
 * Permite buscar usuarios y enviarles solicitud, ver/aceptar/rechazar las
 * solicitudes recibidas, cancelar las enviadas y gestionar la lista de amigos.
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import {
  useFriendsDerived,
  useSearchUsers,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRemoveFriendship,
} from '@/hooks/useFriends';
import { colors, spacing, fontSize, radius } from '@/theme/colors';
import type { ProfileSummary } from '@/types/database';

// Sección con título reutilizable.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

export default function FriendsScreen() {
  const [term, setTerm] = useState('');
  const {
    friends,
    incoming,
    outgoing,
    statusByUser,
    friendshipIdByUser,
    isLoading,
  } = useFriendsDerived();
  const search = useSearchUsers(term);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const removeFriendship = useRemoveFriendship();

  const searching = term.trim().length >= 2;

  function removeFriend(profile: ProfileSummary) {
    const fid = friendshipIdByUser.get(profile.id);
    if (!fid) return;
    Alert.alert('Eliminar amigo', `¿Eliminar a ${profile.username}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeFriendship.mutate(fid),
      },
    ]);
  }

  /** Fila de un resultado de búsqueda con su acción según la relación. */
  function SearchResult({ profile }: { profile: ProfileSummary }) {
    const status = statusByUser.get(profile.id);
    return (
      <View style={styles.row}>
        <Avatar username={profile.username} avatarUrl={profile.avatar_url} size={40} />
        <Text style={styles.rowName}>{profile.username}</Text>
        {status === 'amigo' ? (
          <Text style={styles.tag}>Amigos</Text>
        ) : status === 'enviada' ? (
          <Text style={styles.tag}>Pendiente</Text>
        ) : status === 'recibida' ? (
          <Text style={styles.tag}>Te ha escrito</Text>
        ) : (
          <Pressable
            style={styles.addBtn}
            onPress={() => sendRequest.mutate(profile.id)}
          >
            <Ionicons name="person-add" size={16} color={colors.background} />
            <Text style={styles.addBtnText}>Añadir</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Buscador */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textFaint} />
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Buscar por nombre de usuario"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {term ? (
          <Pressable onPress={() => setTerm('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <Section title="Resultados">
          {search.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (search.data ?? []).length === 0 ? (
            <Text style={styles.empty}>Sin resultados.</Text>
          ) : (
            (search.data ?? []).map((p) => <SearchResult key={p.id} profile={p} />)
          )}
        </Section>
      ) : isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {/* Solicitudes recibidas */}
          {incoming.length > 0 ? (
            <Section title={`Solicitudes (${incoming.length})`}>
              {incoming.map((f) => (
                <View key={f.id} style={styles.row}>
                  <Avatar
                    username={f.requester.username}
                    avatarUrl={f.requester.avatar_url}
                    size={40}
                  />
                  <Text style={styles.rowName}>{f.requester.username}</Text>
                  <Pressable
                    style={styles.iconAccept}
                    onPress={() => acceptRequest.mutate(f.id)}
                    hitSlop={6}
                  >
                    <Ionicons name="checkmark" size={20} color={colors.background} />
                  </Pressable>
                  <Pressable
                    style={styles.iconReject}
                    onPress={() => removeFriendship.mutate(f.id)}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </Section>
          ) : null}

          {/* Solicitudes enviadas */}
          {outgoing.length > 0 ? (
            <Section title="Enviadas">
              {outgoing.map((f) => (
                <View key={f.id} style={styles.row}>
                  <Avatar
                    username={f.addressee.username}
                    avatarUrl={f.addressee.avatar_url}
                    size={40}
                  />
                  <Text style={styles.rowName}>{f.addressee.username}</Text>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => removeFriendship.mutate(f.id)}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                </View>
              ))}
            </Section>
          ) : null}

          {/* Mis amigos */}
          <Section title={`Mis amigos (${friends.length})`}>
            {friends.length === 0 ? (
              <Text style={styles.empty}>
                Aún no tienes amigos. Búscalos arriba para formar tu cuadrilla.
              </Text>
            ) : (
              friends.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Avatar username={p.username} avatarUrl={p.avatar_url} size={40} />
                  <Text style={styles.rowName}>{p.username}</Text>
                  <Pressable onPress={() => removeFriend(p)} hitSlop={8}>
                    <Ionicons
                      name="person-remove-outline"
                      size={20}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </Section>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  tag: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  iconAccept: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconReject: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  empty: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
  },
});
