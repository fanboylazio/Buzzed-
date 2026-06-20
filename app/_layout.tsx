/**
 * Layout raíz de la app.
 *
 * Monta los proveedores globales (React Query, Auth, SafeArea) y aplica el
 * "gate" de navegación: si no hay sesión, se fuerza el grupo (auth); si la hay,
 * se entra a las pestañas principales.
 */
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { colors } from '@/theme/colors';

/** Redirige según el estado de sesión. */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Sin sesión y fuera de auth -> a la bienvenida.
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // Con sesión y en pantallas de auth -> a la home.
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
