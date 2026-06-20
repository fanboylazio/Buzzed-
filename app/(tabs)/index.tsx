/**
 * Pantalla "Registrar" — NÚCLEO de Buzzed (Fase 1).
 *
 * Registro rápido de consumiciones: una rejilla de botones grandes; tocar uno
 * añade +1 al instante (rápido, de noche, con una mano). Debajo, el resumen de
 * la noche y los registros recientes con edición (+/-) y borrado.
 */
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { DrinkChip } from '@/components/DrinkChip';
import { ResponsibleNote } from '@/components/ResponsibleNote';
import { useDrinkTypes } from '@/hooks/useDrinkTypes';
import {
  useConsumptions,
  useAddConsumption,
  useDeleteConsumption,
  useUpdateConsumption,
} from '@/hooks/useConsumptions';
import { logsOfTonight, totalUnits } from '@/lib/stats';
import { colors, spacing, fontSize, radius } from '@/theme/colors';
import type { ConsumptionLogWithDrink } from '@/types/database';

export default function RegisterScreen() {
  const drinkTypes = useDrinkTypes();
  const consumptions = useConsumptions();
  const addConsumption = useAddConsumption();
  const deleteConsumption = useDeleteConsumption();
  const updateConsumption = useUpdateConsumption();

  const logs = consumptions.data ?? [];
  const tonight = useMemo(() => logsOfTonight(logs), [logs]);
  const tonightTotal = totalUnits(tonight);
  const recent = logs.slice(0, 10);

  /** Cambia la cantidad de un registro reciente (edición rápida). */
  function adjust(log: ConsumptionLogWithDrink, delta: number) {
    const next = log.cantidad + delta;
    if (next <= 0) {
      deleteConsumption.mutate(log.id);
    } else {
      updateConsumption.mutate({ id: log.id, cantidad: next });
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera + resumen de la noche */}
        <View style={styles.header}>
          <Text style={styles.greeting}>¿Qué te tomas?</Text>
          <Card style={styles.tonightCard}>
            <View>
              <Text style={styles.tonightLabel}>Esta noche</Text>
              <Text style={styles.tonightValue}>
                {tonightTotal} {tonightTotal === 1 ? 'consumición' : 'consumiciones'}
              </Text>
            </View>
            <Ionicons name="moon" size={28} color={colors.primary} />
          </Card>
        </View>

        {/* Rejilla de registro rápido */}
        {drinkTypes.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : drinkTypes.isError ? (
          <Text style={styles.errorText}>
            No se pudo cargar el catálogo. Revisa tu conexión y la configuración de Supabase.
          </Text>
        ) : (
          <View style={styles.grid}>
            {(drinkTypes.data ?? []).map((drink) => (
              <DrinkChip
                key={drink.id}
                drink={drink}
                busy={addConsumption.isPending}
                onPress={() =>
                  addConsumption.mutate({ drink_type_id: drink.id, cantidad: 1 })
                }
              />
            ))}
          </View>
        )}

        <ResponsibleNote />

        {/* Registros recientes con edición / borrado */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Últimos registros</Text>
          {recent.length === 0 ? (
            <Text style={styles.empty}>
              Aún no hay registros. Toca una bebida para empezar tu noche.
            </Text>
          ) : (
            recent.map((log) => (
              <Card key={log.id} style={styles.recentRow}>
                <Text style={styles.recentIcon}>{log.drink_type.icono}</Text>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{log.drink_type.nombre}</Text>
                  <Text style={styles.recentTime}>{formatTime(log.created_at)}</Text>
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => adjust(log, -1)}
                    hitSlop={8}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </Pressable>
                  <Text style={styles.qty}>{log.cantidad}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => adjust(log, +1)}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={18} color={colors.text} />
                  </Pressable>
                </View>

                <Pressable
                  style={styles.trashBtn}
                  onPress={() => deleteConsumption.mutate(log.id)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/** Formatea la hora de un timestamp ISO como HH:MM. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.md,
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  tonightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tonightLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  tonightValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  recentSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  empty: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    paddingVertical: spacing.md,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  recentIcon: { fontSize: 28 },
  recentInfo: { flex: 1 },
  recentName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  recentTime: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  trashBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
