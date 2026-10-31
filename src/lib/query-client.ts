import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';

// Caché compartida de TanStack Query. No reintenta errores 4xx (validación, permisos, sesión):
// repetirlos no cambia la respuesta. Los fallos de red o 5xx se reintentan una vez.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
                return failureCount < 1;
            },
        },
    },
});
