/**
 * Contenedor base de pantalla: fondo de marca + safe area.
 * Evita repetir SafeAreaView y el color de fondo en cada pantalla.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/colors';

interface ScreenProps {
  children: React.ReactNode;
  /** Si true, añade padding horizontal estándar. */
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, padded = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.container, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
