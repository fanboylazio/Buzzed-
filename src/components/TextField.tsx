/**
 * Campo de texto con etiqueta, estilo de marca y soporte de error.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '@/theme/colors';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginLeft: spacing.xs,
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
    minHeight: 52,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
});
