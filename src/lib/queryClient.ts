/**
 * Cliente de React Query (TanStack Query) compartido por toda la app.
 * Ajustes pensados para una app móvil: menos reintentos y caché razonable.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30s: datos "frescos" suficientes para una noche
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
