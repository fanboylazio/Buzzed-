/**
 * Pantalla "Stats" — estadísticas personales e historial (Fase 1).
 *
 * Muestra de forma INFORMATIVA: total de la noche, totales por tipo, gráfica
 * de evolución de los últimos 7 días e historial agrupado por noche. No es un
 * marcador competitivo (ver principio de producto en el README).
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { BarChart } from '@/components/BarChart';
import { ResponsibleNote } from '@/components/ResponsibleNote';
import { useConsumptions } from '@/hooks/useConsumptions';
import {
  totalsByType,
  totalUnits,
  logsOfTonight,
  dailySeries,
  nightKey,
} from '@/lib/stats';
import { colors, spacing, fontSize, radius } from '@/theme/colors';
import type { ConsumptionLogWithDrink } from '@/types/database';

export default function StatsScreen() {
  const consumptions = useConsumptions();
  const logs = consumptions.data ?? [];

  const tonight = useMemo(() => logsOfTonight(logs), [logs]);
  const byType = useMemo(() => totalsByType(logs), [logs]);
  const series = useMemo(() => dailySeries(logs, 7), [logs]);

  // Historial: agrupar registros por "noche".
  const byNight = useMemo(() => groupByNight(logs), [logs]);

  if (consumptions.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tus estadísticas</Text>

        {/* Resumen de la noche */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardLabel}>Resumen de la noche</Text>
          <Text style={styles.bigNumber}>{totalUnits(tonight)}</Text>
          <Text style={styles.cardSub}>
            consumiciones registradas esta noche
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <ResponsibleNote text="Hidrátate, come algo y no conduzcas si has bebido." />
          </View>
        </Card>

        {/* Evolución últimos 7 días */}
        <Card>
          <Text style={styles.cardLabel}>Evolución (últimos 7 días)</Text>
          <View style={{ marginTop: spacing.md }}>
            <BarChart data={series} />
          </View>
        </Card>

        {/* Totales por tipo (histórico) */}
        <Card>
          <Text style={styles.cardLabel}>Totales por tipo</Text>
          {byType.length === 0 ? (
            <Text style={styles.empty}>Todavía no hay datos.</Text>
          ) : (
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              {byType.map((t) => (
                <View key={t.slug} style={styles.typeRow}>
                  <Text style={styles.typeIcon}>{t.icono}</Text>
                  <Text style={styles.typeName}>{t.nombre}</Text>
                  <Text style={styles.typeTotal}>{t.total}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Historial por noche */}
        <Text style={styles.sectionTitle}>Historial</Text>
        {byNight.length === 0 ? (
          <Text style={styles.empty}>Tu historial aparecerá aquí.</Text>
        ) : (
          byNight.map((night) => (
            <Card key={night.key} style={styles.nightCard}>
              <View style={styles.nightHeader}>
                <Text style={styles.nightDate}>{formatNight(night.key)}</Text>
                <Text style={styles.nightTotal}>{night.total} en total</Text>
              </View>
              <View style={styles.nightTypes}>
                {totalsByType(night.logs).map((t) => (
                  <View key={t.slug} style={styles.nightTypePill}>
                    <Text style={styles.nightTypeText}>
                      {t.icono} {t.total}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

interface NightGroup {
  key: string;
  total: number;
  logs: ConsumptionLogWithDrink[];
}

/** Agrupa los registros por noche (de más reciente a más antigua). */
function groupByNight(logs: ConsumptionLogWithDrink[]): NightGroup[] {
  const map = new Map<string, ConsumptionLogWithDrink[]>();
  for (const log of logs) {
    const key = nightKey(log.created_at);
    const arr = map.get(key) ?? [];
    arr.push(log);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([key, ls]) => ({ key, logs: ls, total: totalUnits(ls) }))
    .sort((a, b) => (a.key < b.key ? 1 : -1));
}

/** Formatea la clave de noche (YYYY-MM-DD) a un texto legible. */
function formatNight(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  summaryCard: {
    alignItems: 'flex-start',
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  bigNumber: {
    color: colors.primary,
    fontSize: fontSize.display,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  cardSub: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
  },
  empty: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeIcon: { fontSize: 22 },
  typeName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  typeTotal: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  nightCard: {
    gap: spacing.sm,
  },
  nightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nightDate: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  nightTotal: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  nightTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nightTypePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  nightTypeText: {
    color: colors.text,
    fontSize: fontSize.sm,
  },
});
