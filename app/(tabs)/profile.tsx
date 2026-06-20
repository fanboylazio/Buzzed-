/**
 * Pantalla "Perfil" (Fases 1-2).
 *
 * Muestra los datos de la cuenta, el acceso a Amigos, permite editar el nombre
 * de usuario y cerrar sesión.
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthProvider';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useConsumptions } from '@/hooks/useConsumptions';
import { useFriendsDerived } from '@/hooks/useFriends';
import {
  getRemindersEnabled,
  setRemindersEnabled,
  scheduleNightSummary,
} from '@/lib/notifications';
import { totalUnits } from '@/lib/stats';
import { colors, spacing, fontSize, radius, fonts } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const consumptions = useConsumptions();
  const { friends } = useFriendsDerived();

  const [username, setUsername] = useState('');
  const [saved, setSaved] = useState(false);
  const [reminders, setReminders] = useState(false);

  // Sincroniza el input cuando llega el perfil.
  useEffect(() => {
    if (profile.data?.username) setUsername(profile.data.username);
  }, [profile.data?.username]);

  // Estado inicial de los recordatorios.
  useEffect(() => {
    getRemindersEnabled().then(setReminders);
  }, []);

  /** Activa/desactiva los recordatorios locales (pide permiso al activar). */
  async function toggleReminders(value: boolean) {
    const ok = await setRemindersEnabled(value);
    setReminders(ok);
    if (value && !ok) {
      Alert.alert(
        'Permiso necesario',
        'Activa las notificaciones de Buzzed en los ajustes del sistema para recibir recordatorios.',
      );
    } else if (ok) {
      // Programamos el resumen de la mañana siguiente.
      scheduleNightSummary().catch(() => {});
    }
  }

  const totalLifetime = totalUnits(consumptions.data ?? []);
  const initial = (profile.data?.username ?? user?.email ?? '?')
    .charAt(0)
    .toUpperCase();

  async function handleSave() {
    setSaved(false);
    if (username.trim().length < 3) return;
    await updateProfile.mutateAsync({ username: username.trim() });
    setSaved(true);
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera de perfil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          {profile.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Text style={styles.name}>{profile.data?.username ?? 'Sin nombre'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </>
          )}
        </View>

        {/* Estadística total de la cuenta */}
        <Card style={styles.statCard}>
          <Ionicons name="albums-outline" size={24} color={colors.primary} />
          <View>
            <Text style={styles.statValue}>{totalLifetime}</Text>
            <Text style={styles.statLabel}>consumiciones registradas en total</Text>
          </View>
        </Card>

        {/* Acceso a Amigos */}
        <Pressable onPress={() => router.push('/friends')}>
          <Card style={styles.navRow}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navTitle}>Amigos</Text>
              <Text style={styles.navSub}>
                {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'} en tu cuadrilla
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Card>
        </Pressable>

        {/* Edición de nombre de usuario */}
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>Editar perfil</Text>
          <TextField
            label="Nombre de usuario"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              setSaved(false);
            }}
            autoCapitalize="none"
          />
          <Button
            label={saved ? 'Guardado ✓' : 'Guardar cambios'}
            onPress={handleSave}
            loading={updateProfile.isPending}
            variant={saved ? 'secondary' : 'primary'}
          />
        </Card>

        {/* Notificaciones / recordatorios */}
        <Card style={styles.reminderCard}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navTitle}>Recordatorios</Text>
            <Text style={styles.navSub}>
              Avisos de consumo responsable y resumen de la noche.
            </Text>
          </View>
          <Switch
            value={reminders}
            onValueChange={toggleReminders}
            trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
            thumbColor={colors.text}
          />
        </Card>

        <Button label="Cerrar sesión" variant="danger" onPress={signOut} />

        <Text style={styles.footer}>
          Buzzed · app privada para tu cuadrilla · solo +18
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: fontSize.display,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: fonts.extrabold,
  },
  email: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  navTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  navSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  footer: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
