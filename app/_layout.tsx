/**
 * Layout raíz de la app.
 *
 * Monta los proveedores globales (React Query, Auth, SafeArea) y aplica el
 * "gate" de navegación: si no hay sesión, se fuerza el grupo (auth); si la hay,
 * se entra a las pestañas principales.
 */
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { ActiveEventProvider } from '@/context/ActiveEventProvider';
import { colors, fonts } from '@/theme/colors';

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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      {/* Crear publicación: se presenta como modal. */}
      <Stack.Screen name="post/new" options={{ presentation: 'modal' }} />
      {/* Detalle de publicación con cabecera oscura. */}
      <Stack.Screen
        name="post/[id]"
        options={{
          headerShown: true,
          title: 'Publicación',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontFamily: fonts.bold },
        }}
      />
      {/* Amigos: cabecera oscura. */}
      <Stack.Screen
        name="friends"
        options={{
          headerShown: true,
          title: 'Amigos',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontFamily: fonts.bold },
        }}
      />
      {/* Crear evento: modal. */}
      <Stack.Screen name="event/new" options={{ presentation: 'modal' }} />
      {/* Detalle de evento: cabecera oscura. */}
      <Stack.Screen
        name="event/[id]"
        options={{
          headerShown: true,
          title: 'Evento',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontFamily: fonts.bold },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  // Cargamos la tipografía de marca (Inter) antes de pintar la app.
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ActiveEventProvider>
            <StatusBar style="light" />
            <AuthGate />
          </ActiveEventProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
