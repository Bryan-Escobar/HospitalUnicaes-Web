import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import type { EstadoAcceso } from '@/types/auth.types';


export interface AuthState {
    session: Session | null;
    setSession: (session: Session | null) => void;
    isLoggedIn: boolean;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    // Resultado de GET /auth/me para la sesión actual (rol y cuenta activa)
    acceso: EstadoAcceso | null;
    setAcceso: (acceso: EstadoAcceso | null) => void;
    // La sesión terminó sin que el usuario cerrara sesión (no se pudo renovar el token)
    sesionExpirada: boolean;
    setSesionExpirada: (sesionExpirada: boolean) => void;
    // Deja el estado como si nunca se hubiera iniciado sesión
    reset: () => void;
}

// Creation of a Zustand store to manage authentication state
export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    setSession: (session) => set({ session }),
    isLoggedIn: false,
    setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
    isLoading: true,
    setIsLoading: (isLoading) => set({ isLoading }),
    error: null,
    setError: (error) => set({ error }),
    acceso: null,
    setAcceso: (acceso) => set({ acceso }),
    sesionExpirada: false,
    setSesionExpirada: (sesionExpirada) => set({ sesionExpirada }),
    reset: () => set({ session: null, isLoggedIn: false, error: null, acceso: null }),
}));
