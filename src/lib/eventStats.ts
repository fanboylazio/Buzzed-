/**
 * Agregaciones del diario compartido de un evento.
 *
 * Funciones informativas: totales por persona y por equipo. No ordenan por
 * "quién más consume" como criterio de victoria; el orden es solo de lectura.
 */
import type { EventConsumption, TeamWithMembers } from '@/types/database';

export interface PersonTotals {
  usuario: EventConsumption['usuario'];
  total: number;
  byType: { icono: string; nombre: string; total: number }[];
}

/** Totales por persona a partir de las consumiciones del evento. */
export function totalsByPerson(consumptions: EventConsumption[]): PersonTotals[] {
  const map = new Map<
    string,
    {
      usuario: EventConsumption['usuario'];
      total: number;
      types: Map<number, { icono: string; nombre: string; total: number }>;
    }
  >();

  for (const c of consumptions) {
    let entry = map.get(c.usuario_id);
    if (!entry) {
      entry = { usuario: c.usuario, total: 0, types: new Map() };
      map.set(c.usuario_id, entry);
    }
    entry.total += c.cantidad;
    const t = entry.types.get(c.drink_type_id);
    if (t) {
      t.total += c.cantidad;
    } else {
      entry.types.set(c.drink_type_id, {
        icono: c.drink_type.icono,
        nombre: c.drink_type.nombre,
        total: c.cantidad,
      });
    }
  }

  return [...map.values()]
    .map((e) => ({
      usuario: e.usuario,
      total: e.total,
      byType: [...e.types.values()].sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => a.usuario.username.localeCompare(b.usuario.username));
}

export interface TeamTotals {
  team: TeamWithMembers;
  total: number;
}

/** Totales por equipo (suma de las consumiciones de sus miembros). */
export function totalsByTeam(
  consumptions: EventConsumption[],
  teams: TeamWithMembers[],
): TeamTotals[] {
  // Total por usuario, reutilizable para sumar por equipo.
  const perUser = new Map<string, number>();
  for (const c of consumptions) {
    perUser.set(c.usuario_id, (perUser.get(c.usuario_id) ?? 0) + c.cantidad);
  }

  return teams
    .map((team) => ({
      team,
      total: team.miembros.reduce((acc, m) => acc + (perUser.get(m.id) ?? 0), 0),
    }))
    .sort((a, b) => a.team.nombre.localeCompare(b.team.nombre));
}

/** Total general de consumiciones del evento. */
export function eventTotal(consumptions: EventConsumption[]): number {
  return consumptions.reduce((acc, c) => acc + c.cantidad, 0);
}
