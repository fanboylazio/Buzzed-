/**
 * Detalle de evento (Fase 3).
 *
 * Cabecera con info y acciones (apuntarse/salir, registrar aquí, borrar) y un
 * selector de secciones: Participantes · Equipos · Feed · Diario (stats).
 */
import { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { PostCard } from '@/components/PostCard';
import { ResponsibleNote } from '@/components/ResponsibleNote';
import { useAuth } from '@/context/AuthProvider';
import { useActiveEvent } from '@/context/ActiveEventProvider';
import {
  useEvent,
  useEventMembers,
  useJoinEvent,
  useLeaveEvent,
  useDeleteEvent,
} from '@/hooks/useEvents';
import {
  useEventTeams,
  useCreateTeam,
  useJoinTeam,
  useLeaveTeam,
  useDeleteTeam,
} from '@/hooks/useTeams';
import { useEventConsumptions } from '@/hooks/useEventStats';
import { useFeed, useToggleLike, useDeletePost } from '@/hooks/useFeed';
import { totalsByPerson, totalsByTeam, eventTotal } from '@/lib/eventStats';
import { colors, spacing, fontSize, radius } from '@/theme/colors';
import type { TeamType, TeamWithMembers, FeedPost } from '@/types/database';

type SectionKey = 'participantes' | 'equipos' | 'feed' | 'diario';

const TEAM_TYPES: { key: TeamType; label: string }[] = [
  { key: 'individual', label: 'Individual' },
  { key: 'pareja', label: 'Pareja' },
  { key: 'trio', label: 'Trío' },
  { key: 'equipo', label: 'Equipo' },
];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = String(id);
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const { setActiveEvent } = useActiveEvent();

  const [section, setSection] = useState<SectionKey>('participantes');

  // Datos (todos los hooks se llaman siempre, sin condicionales).
  const event = useEvent(eventId);
  const members = useEventMembers(eventId);
  const teams = useEventTeams(eventId);
  const consumptions = useEventConsumptions(eventId);
  const feed = useFeed(eventId);

  const joinEvent = useJoinEvent();
  const leaveEvent = useLeaveEvent();
  const deleteEvent = useDeleteEvent();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  const me = user?.id;
  const amMember = (members.data ?? []).some((m) => m.usuario_id === me);
  const isCreator = event.data?.creador_id === me;

  // Título de la pantalla = nombre del evento.
  useLayoutEffect(() => {
    if (event.data?.nombre) {
      navigation.setOptions({ title: event.data.nombre });
    }
  }, [navigation, event.data?.nombre]);

  function goRegisterHere() {
    if (event.data) {
      setActiveEvent({ id: eventId, nombre: event.data.nombre });
      router.push('/(tabs)/registrar');
    }
  }

  function publishHere() {
    if (event.data) {
      setActiveEvent({ id: eventId, nombre: event.data.nombre });
      router.push('/post/new');
    }
  }

  function confirmDeleteEvent() {
    Alert.alert('Borrar evento', '¿Seguro? Se borrará para todos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () =>
          deleteEvent.mutate(eventId, { onSuccess: () => router.back() }),
      },
    ]);
  }

  if (event.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (!event.data) {
    return (
      <Screen>
        <Text style={styles.errorText}>No se encontró el evento.</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera con info y acciones */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={event.data.tipo === 'privado' ? 'lock-closed' : 'earth'}
                size={12}
                color={colors.primary}
              />
              <Text style={styles.typeText}>
                {event.data.tipo === 'privado' ? 'Privado' : 'Público'}
              </Text>
            </View>
            {isCreator ? (
              <Pressable onPress={confirmDeleteEvent} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>

          {event.data.descripcion ? (
            <Text style={styles.desc}>{event.data.descripcion}</Text>
          ) : null}

          {/* Acciones principales */}
          <View style={styles.actions}>
            {amMember ? (
              <>
                <Pressable style={styles.primaryAction} onPress={goRegisterHere}>
                  <Ionicons name="add-circle" size={18} color={colors.background} />
                  <Text style={styles.primaryActionText}>Registrar aquí</Text>
                </Pressable>
                {!isCreator ? (
                  <Pressable
                    style={styles.secondaryAction}
                    onPress={() => leaveEvent.mutate(eventId)}
                  >
                    <Text style={styles.secondaryActionText}>Salir</Text>
                  </Pressable>
                ) : null}
              </>
            ) : event.data.tipo === 'publico' ? (
              <Pressable
                style={styles.primaryAction}
                onPress={() => joinEvent.mutate(eventId)}
              >
                <Ionicons name="person-add" size={18} color={colors.background} />
                <Text style={styles.primaryActionText}>Apuntarme</Text>
              </Pressable>
            ) : (
              <Text style={styles.hint}>Evento privado por invitación.</Text>
            )}
          </View>
        </View>

        {/* Selector de secciones */}
        <View style={styles.tabs}>
          {(
            [
              ['participantes', 'Gente'],
              ['equipos', 'Equipos'],
              ['feed', 'Feed'],
              ['diario', 'Diario'],
            ] as [SectionKey, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.tab, section === key && styles.tabActive]}
              onPress={() => setSection(key)}
            >
              <Text style={[styles.tabText, section === key && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Contenido de la sección activa */}
        <View style={styles.sectionContent}>
          {section === 'participantes' ? (
            <ParticipantsSection members={members.data ?? []} loading={members.isLoading} />
          ) : section === 'equipos' ? (
            <TeamsSection
              eventId={eventId}
              teams={teams.data ?? []}
              loading={teams.isLoading}
              canManage={amMember}
              me={me}
            />
          ) : section === 'feed' ? (
            <EventFeedSection
              feed={feed.data ?? []}
              loading={feed.isLoading}
              me={me}
              canPost={amMember}
              onPublish={publishHere}
              onToggleLike={(p) =>
                toggleLike.mutate({ postId: p.id, likedByMe: p.likedByMe })
              }
              onComments={(p) => router.push(`/post/${p.id}`)}
              onDelete={(p) =>
                deletePost.mutate({ postId: p.id, fotoPath: p.foto_path })
              }
            />
          ) : (
            <DiarySection
              consumptions={consumptions.data ?? []}
              teams={teams.data ?? []}
              loading={consumptions.isLoading}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/* --------------------------------- Secciones ------------------------------- */

function ParticipantsSection({
  members,
  loading,
}: {
  members: import('@/types/database').EventMemberWithProfile[];
  loading: boolean;
}) {
  if (loading) return <ActivityIndicator color={colors.primary} />;
  if (members.length === 0)
    return <Text style={styles.empty}>Aún no hay participantes.</Text>;
  return (
    <View style={{ gap: spacing.sm }}>
      {members.map((m) => (
        <View key={m.id} style={styles.row}>
          <Avatar username={m.usuario.username} avatarUrl={m.usuario.avatar_url} size={40} />
          <Text style={styles.rowName}>{m.usuario.username}</Text>
          {m.rol === 'creador' ? <Text style={styles.creatorTag}>Organiza</Text> : null}
        </View>
      ))}
    </View>
  );
}

function TeamsSection({
  eventId,
  teams,
  loading,
  canManage,
  me,
}: {
  eventId: string;
  teams: TeamWithMembers[];
  loading: boolean;
  canManage: boolean;
  me: string | undefined;
}) {
  const createTeam = useCreateTeam(eventId);
  const joinTeam = useJoinTeam(eventId);
  const leaveTeam = useLeaveTeam(eventId);
  const deleteTeam = useDeleteTeam(eventId);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TeamType>('equipo');

  const allTeamIds = teams.map((t) => t.id);

  async function handleCreate() {
    if (nombre.trim().length < 1) return;
    await createTeam.mutateAsync({ nombre, tipo });
    setNombre('');
    setShowForm(false);
  }

  if (loading) return <ActivityIndicator color={colors.primary} />;

  return (
    <View style={{ gap: spacing.md }}>
      {teams.length === 0 ? (
        <Text style={styles.empty}>
          Todavía no hay equipos. Crea uno para organizar a la cuadrilla.
        </Text>
      ) : (
        teams.map((team) => {
          const iAmIn = team.miembros.some((p) => p.id === me);
          return (
            <Card key={team.id} style={{ gap: spacing.sm }}>
              <View style={styles.teamHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{team.nombre}</Text>
                  <Text style={styles.teamType}>
                    {TEAM_TYPES.find((t) => t.key === team.tipo)?.label} ·{' '}
                    {team.miembros.length}{' '}
                    {team.miembros.length === 1 ? 'persona' : 'personas'}
                  </Text>
                </View>
                {canManage ? (
                  iAmIn ? (
                    <Pressable
                      style={styles.teamLeaveBtn}
                      onPress={() => leaveTeam.mutate(team.id)}
                    >
                      <Text style={styles.teamLeaveText}>Salir</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={styles.teamJoinBtn}
                      onPress={() =>
                        joinTeam.mutate({
                          teamId: team.id,
                          otherTeamIds: allTeamIds.filter((tid) => tid !== team.id),
                        })
                      }
                    >
                      <Text style={styles.teamJoinText}>Unirme</Text>
                    </Pressable>
                  )
                ) : null}
              </View>

              {/* Miembros del equipo */}
              {team.miembros.length > 0 ? (
                <View style={styles.teamMembers}>
                  {team.miembros.map((p) => (
                    <View key={p.id} style={styles.teamMemberPill}>
                      <Avatar username={p.username} avatarUrl={p.avatar_url} size={22} />
                      <Text style={styles.teamMemberName}>{p.username}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {canManage ? (
                <Pressable
                  onPress={() =>
                    Alert.alert('Borrar equipo', `¿Borrar "${team.nombre}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Borrar',
                        style: 'destructive',
                        onPress: () => deleteTeam.mutate(team.id),
                      },
                    ])
                  }
                >
                  <Text style={styles.deleteTeamText}>Borrar equipo</Text>
                </Pressable>
              ) : null}
            </Card>
          );
        })
      )}

      {/* Crear equipo */}
      {canManage ? (
        showForm ? (
          <Card style={{ gap: spacing.md }}>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre del equipo"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
            />
            <View style={styles.typeRow}>
              {TEAM_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.typeChip, tipo === t.key && styles.typeChipActive]}
                  onPress={() => setTipo(t.key)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      tipo === t.key && styles.typeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formActions}>
              <Pressable style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Crear</Text>
              </Pressable>
              <Pressable onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <Pressable style={styles.addTeamBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addTeamText}>Crear equipo</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

function EventFeedSection({
  feed,
  loading,
  me,
  canPost,
  onPublish,
  onToggleLike,
  onComments,
  onDelete,
}: {
  feed: FeedPost[];
  loading: boolean;
  me: string | undefined;
  canPost: boolean;
  onPublish: () => void;
  onToggleLike: (p: FeedPost) => void;
  onComments: (p: FeedPost) => void;
  onDelete: (p: FeedPost) => void;
}) {
  return (
    <View style={{ gap: spacing.lg }}>
      {canPost ? (
        <Pressable style={styles.addTeamBtn} onPress={onPublish}>
          <Ionicons name="camera" size={18} color={colors.primary} />
          <Text style={styles.addTeamText}>Publicar en el evento</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : feed.length === 0 ? (
        <Text style={styles.empty}>Aún no hay publicaciones en el evento.</Text>
      ) : (
        feed.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            isOwn={p.autor_id === me}
            onToggleLike={() => onToggleLike(p)}
            onPressComments={() => onComments(p)}
            onDelete={() => onDelete(p)}
          />
        ))
      )}
    </View>
  );
}

function DiarySection({
  consumptions,
  teams,
  loading,
}: {
  consumptions: import('@/types/database').EventConsumption[];
  teams: TeamWithMembers[];
  loading: boolean;
}) {
  const byPerson = useMemo(() => totalsByPerson(consumptions), [consumptions]);
  const byTeam = useMemo(() => totalsByTeam(consumptions, teams), [consumptions, teams]);
  const total = eventTotal(consumptions);

  if (loading) return <ActivityIndicator color={colors.primary} />;

  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total del evento</Text>
        <Text style={styles.totalValue}>{total}</Text>
        <Text style={styles.totalSub}>consumiciones registradas en el evento</Text>
      </Card>

      <Text style={styles.diaryNote}>
        Registro compartido del evento. Es informativo: no es un marcador ni premia
        consumir más.
      </Text>

      {/* Por equipo */}
      {byTeam.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.diaryTitle}>Por equipo</Text>
          {byTeam.map((t) => (
            <View key={t.team.id} style={styles.row}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.rowName}>{t.team.nombre}</Text>
              <Text style={styles.diaryTotal}>{t.total}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Por persona */}
      <View style={{ gap: spacing.sm }}>
        <Text style={styles.diaryTitle}>Por persona</Text>
        {byPerson.length === 0 ? (
          <Text style={styles.empty}>
            Nadie ha registrado nada en el evento todavía.
          </Text>
        ) : (
          byPerson.map((p) => (
            <Card key={p.usuario.id} style={styles.personCard}>
              <View style={styles.personHeader}>
                <Avatar
                  username={p.usuario.username}
                  avatarUrl={p.usuario.avatar_url}
                  size={32}
                />
                <Text style={styles.rowName}>{p.usuario.username}</Text>
                <Text style={styles.diaryTotal}>{p.total}</Text>
              </View>
              <View style={styles.personTypes}>
                {p.byType.map((t, i) => (
                  <View key={i} style={styles.typePill}>
                    <Text style={styles.typePillText}>
                      {t.icono} {t.total}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ))
        )}
      </View>

      <ResponsibleNote />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.md,
  },
  header: {
    gap: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  typeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  desc: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryActionText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  secondaryAction: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.background,
  },
  sectionContent: {
    minHeight: 200,
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
  creatorTag: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  empty: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    paddingVertical: spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  teamType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  teamJoinBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  teamJoinText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  teamLeaveBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  teamLeaveText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  teamMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  teamMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingRight: spacing.md,
    paddingLeft: 4,
    paddingVertical: 4,
  },
  teamMemberName: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  deleteTeamText: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  addTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  addTeamText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: colors.background,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  totalCard: {
    alignItems: 'flex-start',
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.primary,
    fontSize: fontSize.display,
    fontWeight: '800',
  },
  totalSub: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
  },
  diaryNote: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 17,
  },
  diaryTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  diaryTotal: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  personCard: {
    gap: spacing.sm,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  personTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typePillText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
});
