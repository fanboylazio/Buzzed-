/**
 * Pantalla de bienvenida / onboarding.
 * Presenta la marca y lleva a registro o login.
 */
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { colors, spacing, fontSize, radius } from '@/theme/colors';

export default function Welcome() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍻</Text>
          </View>
          <Text style={styles.title}>Buzzed</Text>
          <Text style={styles.subtitle}>
            El diario de fiesta de tu cuadrilla. Registra, comparte y recuerda
            las noches con los tuyos.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button label="Crear cuenta" onPress={() => router.push('/(auth)/register')} />
          <Button
            label="Ya tengo cuenta"
            variant="secondary"
            onPress={() => router.push('/(auth)/login')}
          />
          <Text style={styles.legal}>Solo para mayores de 18 años. Bebe con responsabilidad.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.display,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  legal: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
