/**
 * Tarjeta grande de un tipo de consumición para el registro rápido.
 * Botón amplio (uso con una mano, de noche): icono + nombre.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '@/theme/colors';
import type { DrinkType } from '@/types/database';

interface DrinkChipProps {
  drink: DrinkType;
  onPress: () => void;
  busy?: boolean;
}

export function DrinkChip({ drink, onPress, busy }: DrinkChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        busy && styles.busy,
      ]}
    >
      <Text style={styles.icon}>{drink.icono}</Text>
      <Text style={styles.name}>{drink.nombre}</Text>
      {drink.unidad_referencia ? (
        <Text style={styles.unit}>{drink.unidad_referencia}</Text>
      ) : null}
      <View style={styles.plus}>
        <Text style={styles.plusText}>+1</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '30%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    transform: [{ scale: 0.98 }],
  },
  busy: { opacity: 0.5 },
  icon: { fontSize: 40 },
  name: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  unit: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },
  plus: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  plusText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
});
