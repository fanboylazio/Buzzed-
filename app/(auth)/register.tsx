/**
 * Pantalla de registro con GATE +18.
 *
 * Recoge usuario, email, contraseña y fecha de nacimiento. Calcula la edad y
 * exige confirmación de mayoría de edad antes de crear la cuenta. El perfil se
 * crea automáticamente en la base de datos mediante un trigger que lee los
 * metadatos (username, birthdate) enviados en el alta.
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { colors, spacing, fontSize, radius } from '@/theme/colors';

/** Convierte "DD/MM/AAAA" a Date, o null si no es válida. */
function parseBirthdate(input: string): Date | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  ) {
    return null; // fecha imposible (p. ej. 31/02)
  }
  return d;
}

/** Calcula la edad en años a partir de una fecha de nacimiento. */
function ageFrom(birth: Date, now = new Date()): number {
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setInfo(null);

    // Validaciones básicas.
    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (!email.trim()) {
      setError('Introduce un email válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // GATE +18: fecha válida + edad >= 18 + confirmación explícita.
    const birth = parseBirthdate(birthdate);
    if (!birth) {
      setError('Introduce tu fecha de nacimiento como DD/MM/AAAA.');
      return;
    }
    if (ageFrom(birth) < 18) {
      setError('Lo sentimos: Buzzed es solo para mayores de 18 años.');
      return;
    }
    if (!confirmAdult) {
      setError('Debes confirmar que eres mayor de edad.');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Estos metadatos los usa el trigger de la BD para crear el perfil.
        data: {
          username: username.trim(),
          birthdate: birth.toISOString().slice(0, 10),
        },
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // Si la confirmación por email está activada, no habrá sesión todavía.
    if (data.session) {
      // El AuthGate redirige a las pestañas automáticamente.
    } else {
      setInfo('Cuenta creada. Revisa tu email para confirmar y luego inicia sesión.');
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Únete a la cuadrilla en Buzzed.</Text>

          <View style={styles.form}>
            <TextField
              label="Nombre de usuario"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="ej. alvaro"
            />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@email.com"
            />
            <TextField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="mínimo 6 caracteres"
            />
            <TextField
              label="Fecha de nacimiento"
              value={birthdate}
              onChangeText={setBirthdate}
              keyboardType="numbers-and-punctuation"
              placeholder="DD/MM/AAAA"
            />

            {/* Confirmación explícita de mayoría de edad (+18). */}
            <Pressable
              style={styles.checkRow}
              onPress={() => setConfirmAdult((v) => !v)}
            >
              <View style={[styles.checkbox, confirmAdult && styles.checkboxOn]}>
                {confirmAdult ? (
                  <Ionicons name="checkmark" size={16} color={colors.background} />
                ) : null}
              </View>
              <Text style={styles.checkLabel}>
                Confirmo que soy mayor de 18 años.
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Button label="Crear cuenta" onPress={handleRegister} loading={loading} />
            <Button
              label="Ya tengo cuenta"
              variant="ghost"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    flex: 1,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  info: {
    color: colors.success,
    fontSize: fontSize.sm,
  },
});
