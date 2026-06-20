/**
 * Aviso breve de consumo responsable.
 * Se coloca en sitios discretos (resumen de la noche, registro) sin estorbar.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize } from '@/theme/colors';

export function ResponsibleNote({ text }: { text?: string }) {
  return (
    <View style={styles.wrapper}>
      <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
      <Text style={styles.text}>
        {text ?? 'Bebe con cabeza y cuida a tu cuadrilla. Si bebes, no conduzcas.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
});
