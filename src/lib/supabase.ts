/**
 * Cliente de Supabase para toda la app.
 *
 * - Lee las claves desde variables de entorno públicas (EXPO_PUBLIC_*).
 * - Persiste la sesión de forma segura usando expo-secure-store (cifrado),
 *   con respaldo a AsyncStorage en plataformas donde SecureStore no aplique.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Aviso claro en desarrollo si faltan las claves.
  console.warn(
    '[Buzzed] Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env y rellena tus claves de Supabase.',
  );
}

/**
 * Adaptador de almacenamiento para la sesión.
 * En móvil usamos SecureStore (cifrado por el SO); en web caemos a AsyncStorage.
 * SecureStore limita el tamaño de valor a ~2KB, suficiente para los tokens.
 */
const ExpoSecureStorage = {
  getItem: (key: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.getItem(key)
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.setItem(key, value)
      : SecureStore.setItemAsync(key, value),
  removeItem: (key: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.removeItem(key)
      : SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'public-anon-key',
  {
    auth: {
      storage: ExpoSecureStorage,
      autoRefreshToken: true,
      persistSession: true,
      // No usamos detección por URL (no es una app web con magic links).
      detectSessionInUrl: false,
    },
  },
);
