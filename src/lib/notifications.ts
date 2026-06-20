/**
 * Notificaciones locales (Fase 4).
 *
 * Buzzed usa SOLO notificaciones locales (sin servidor de push): recordatorios
 * suaves de consumo responsable y el "resumen de la noche" a la mañana
 * siguiente. El usuario las activa desde Perfil.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { colors } from '@/theme/colors';

const ENABLED_KEY = 'buzzed.reminders.enabled';

// Mostrar las notificaciones aunque la app esté en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Crea el canal de Android (necesario para que se muestren). */
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('buzzed', {
      name: 'Buzzed',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: colors.primary,
    });
  }
}

/** ¿Tiene el usuario activados los recordatorios? */
export async function getRemindersEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ENABLED_KEY);
  return value === 'true';
}

/**
 * Activa o desactiva los recordatorios. Al activar pide permiso; si se deniega
 * devuelve false. Al desactivar cancela lo programado.
 */
export async function setRemindersEnabled(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    await AsyncStorage.setItem(ENABLED_KEY, 'false');
    await Notifications.cancelAllScheduledNotificationsAsync();
    return false;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    await AsyncStorage.setItem(ENABLED_KEY, 'false');
    return false;
  }

  await ensureAndroidChannel();
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  return true;
}

/**
 * Muestra un aviso suave de hidratación (consumo responsable).
 * Solo se dispara si el usuario tiene los recordatorios activados.
 */
export async function notifyHydration(): Promise<void> {
  if (!(await getRemindersEnabled())) return;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Cuídate 💧',
      body: 'Llevas unas cuantas. Bebe agua, come algo y no conduzcas.',
    },
    trigger: null, // inmediata
  });
}

/**
 * Programa el "resumen de la noche" para la próxima mañana (11:00).
 * Si ya pasó hoy de las 11:00, se programa para mañana.
 */
export async function scheduleNightSummary(): Promise<void> {
  if (!(await getRemindersEnabled())) return;
  await ensureAndroidChannel();

  const when = new Date();
  when.setHours(11, 0, 0, 0);
  if (when.getTime() <= Date.now()) {
    when.setDate(when.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '¿Cómo fue la noche? 🌅',
      body: 'Echa un vistazo a tu resumen en Buzzed.',
    },
    trigger: when,
  });
}
