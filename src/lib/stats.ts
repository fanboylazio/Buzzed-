/**
 * Utilidades de estadísticas personales.
 *
 * Principio de producto: estas funciones agregan datos de forma INFORMATIVA
 * (totales, evolución por día, resumen de la noche). No calculan rankings ni
 * "ganadores" por consumir más.
 */
import type { ConsumptionLogWithDrink } from '@/types/database';

/** Devuelve la clave de día local (YYYY-MM-DD) de una fecha ISO. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Una "noche" empieza a las 06:00: lo registrado entre medianoche y las 6am
 * cuenta para la noche anterior (criterio típico de salir de fiesta).
 */
export function nightKey(iso: string): string {
  const d = new Date(iso);
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  return dayKey(d.toISOString());
}

/** Total de unidades por tipo de bebida. */
export function totalsByType(
  logs: ConsumptionLogWithDrink[],
): { slug: string; nombre: string; icono: string; total: number }[] {
  const map = new Map<
    number,
    { slug: string; nombre: string; icono: string; total: number }
  >();
  for (const log of logs) {
    const dt = log.drink_type;
    const prev = map.get(dt.id);
    if (prev) {
      prev.total += log.cantidad;
    } else {
      map.set(dt.id, {
        slug: dt.slug,
        nombre: dt.nombre,
        icono: dt.icono,
        total: log.cantidad,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Total general de unidades registradas. */
export function totalUnits(logs: ConsumptionLogWithDrink[]): number {
  return logs.reduce((acc, l) => acc + l.cantidad, 0);
}

/** Filtra los registros de la noche actual (según nightKey de "ahora"). */
export function logsOfTonight(
  logs: ConsumptionLogWithDrink[],
  now: Date = new Date(),
): ConsumptionLogWithDrink[] {
  const tonight = nightKey(now.toISOString());
  return logs.filter((l) => nightKey(l.created_at) === tonight);
}

/**
 * Serie de los últimos N días (para la gráfica de evolución).
 * Devuelve un array ordenado de más antiguo a más reciente.
 */
export function dailySeries(
  logs: ConsumptionLogWithDrink[],
  days = 7,
  now: Date = new Date(),
): { label: string; value: number; key: string }[] {
  const totals = new Map<string, number>();
  for (const log of logs) {
    const key = dayKey(log.created_at);
    totals.set(key, (totals.get(key) ?? 0) + log.cantidad);
  }

  const weekdayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const series: { label: string; value: number; key: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.toISOString());
    series.push({
      key,
      label: weekdayLabels[d.getDay()],
      value: totals.get(key) ?? 0,
    });
  }
  return series;
}
