/**
 * Pantalla "Eventos" (Fase 3): lista de eventos + crear evento.
 */
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useEvents, type EventListItem } from '@/hooks/useEvents';
import { colors, spacing, fontSize, radius, fonts } from '@/theme/colors';

/** Formatea el rango de fechas de un evento. */
function formatDates(item: EventListItem): string {
  const inicio = new Date(item.fecha_inicio).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  if (!item.fecha_fin) return inicio;
  const fin = new Date(item.fecha_fin).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
  return `${inicio} – ${fin}`;
}

export default function EventsScreen() {
  const router = useRouter();
  const events = useEvents();

  const renderItem = ({ item }: { item: EventListItem }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/event/${item.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, item.tipo === 'privado' && styles.typeBadgePrivate]}>
          <Ionicons
            name={item.tipo === 'privado' ? 'lock-closed' : 'earth'}
            size={12}
            color={item.tipo === 'privado' ? colors.warning : colors.primary}
          />
          <Text
            style={[
              styles.typeText,
              { color: item.tipo === 'privado' ? colors.warning : colors.primary },
            ]}
          >
            {item.tipo === 'privado' ? 'Privado' : 'Público'}
          </Text>
        </View>
        {item.isActive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>En marcha</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.name}>{item.nombre}</Text>
      {item.descripcion ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.descripcion}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatDates(item)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{item.memberCount}</Text>
        </View>
        {item.amMember ? (
          <View style={styles.memberTag}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.memberTagText}>Apuntado</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Eventos</Text>
        <Pressable
          style={styles.newBtn}
          onPress={() => router.push('/event/new')}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color={colors.background} />
        </Pressable>
      </View>

      {events.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={events.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={events.isRefetching}
              onRefresh={events.refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>No hay eventos todavía</Text>
              <Text style={styles.emptyText}>
                Crea una fiesta o evento para apuntarte con tu cuadrilla.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/event/new')}>
                <Text style={styles.emptyBtnText}>Crear evento</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTop: {
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
  typeBadgePrivate: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  desc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  memberTagText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
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
