import { createContext, useCallback, useEffect, useRef, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from 'react-router-dom';
import type { EstadoAcceso, LoginRequest } from "@/types/auth.types";
import { useAuthStore } from "@/store/useAuthStore";
import { isDemoMode, supabase } from "@/lib/client";
import { verificarAcceso } from "@/services/auth.service";

const DEMO_SESSION_KEY = "hu-demo-session";

// Sesión mínima para el modo demostración (sin Supabase configurado).
function demoSession(email: string): Session {
    return { user: { id: email, email, user_metadata: {} } } as unknown as Session;
}

function readDemoSession(): Session | null {
    try {
        const email = sessionStorage.getItem(DEMO_SESSION_KEY);
        return email ? demoSession(email) : null;
    } catch {
        return null;
    }
}


export interface AuthContextProps {
    session: Session | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    error: string | null;
    acceso: EstadoAcceso | null;
    sesionExpirada: boolean;
    logOut: () => Promise<void>;
    logIn: (credentials: LoginRequest) => Promise<void>;
    reintentarAcceso: () => void;
    clearError: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
    session: null,
    isLoading: true,
    isLoggedIn: false,
    error: null,
    acceso: null,
    sesionExpirada: false,
    logOut: async () => { },
    logIn: async () => { },
    reintentarAcceso: () => { },
    clearError: () => { },
});

export function AuthProvider({ children }: PropsWithChildren) {
    const navigate = useNavigate();

    // Obtener estados del store
    const session = useAuthStore((state) => state.session);
    const isLoading = useAuthStore((state) => state.isLoading);
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const error = useAuthStore((state) => state.error);
    const acceso = useAuthStore((state) => state.acceso);
    const sesionExpirada = useAuthStore((state) => state.sesionExpirada);

    // Obtener funciones del store
    const setSession = useAuthStore((state) => state.setSession);
    const setIsLoggedIn = useAuthStore((state) => state.setIsLoggedIn);
    const setIsLoading = useAuthStore((state) => state.setIsLoading);
    const setError = useAuthStore((state) => state.setError);
    const setAcceso = useAuthStore((state) => state.setAcceso);
    const setSesionExpirada = useAuthStore((state) => state.setSesionExpirada);
    const reset = useAuthStore((state) => state.reset);

    // true mientras el usuario cierra sesión: distingue un logout de una sesión que expiró
    const cerrandoSesion = useRef(false);

    const clearError = () => setError(null);


    useEffect(() => {
        setIsLoading(true);

        if (isDemoMode) {
            const session = readDemoSession();
            setSession(session);
            setIsLoggedIn(!!session);
            setIsLoading(false);
            return;
        }

        // Carga inicial de sesión
        supabase.auth.getSession()
            .then(({ data }: { data: { session: Session | null } }) => {
                setSession(data.session);
                setIsLoggedIn(!!data.session);
            })
            .catch((error: unknown) => {
                console.error("[AuthContext] Error getting session:", error);
                setIsLoggedIn(false);
            })
            .finally(() => {
                setIsLoading(false);
            });

        // Suscripción a cambios de autenticación. TOKEN_REFRESHED solo cambia el token: el usuario
        // sigue en la misma pantalla y el acceso no se vuelve a verificar.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                if (!cerrandoSesion.current) setSesionExpirada(true);
                reset();
                return;
            }
            setSession(session);
            setIsLoggedIn(!!session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [reset, setIsLoading, setIsLoggedIn, setSession, setSesionExpirada]);

    // Verifica rol y estado de la cuenta (GET /auth/me) una vez por usuario.
    const userId = session?.user?.id;
    const email = session?.user?.email ?? '';
    const accesoVigente = !!acceso && acceso.userId === userId;

    const comprobarAcceso = useCallback(() => {
        if (!userId) return;
        let cancelado = false;
        verificarAcceso(userId, email).then((resultado) => {
            // Solo se guarda si la sesión sigue siendo de ese usuario
            if (!cancelado && useAuthStore.getState().session?.user?.id === userId) setAcceso(resultado);
        });
        return () => {
            cancelado = true;
        };
    }, [userId, email, setAcceso]);

    useEffect(() => {
        if (!accesoVigente) return comprobarAcceso();
    }, [accesoVigente, comprobarAcceso]);

    const reintentarAcceso = () => {
        setAcceso(null);
    };

    const logIn = async (credentials: LoginRequest) => {
        setIsLoading(true)
        setError(null)
        setSesionExpirada(false)

        try {
            if (isDemoMode) {
                await new Promise((resolve) => setTimeout(resolve, 600))
                try {
                    sessionStorage.setItem(DEMO_SESSION_KEY, credentials.email)
                } catch {
                    // sin almacenamiento: la sesión de demostración dura hasta recargar
                }
                setSession(demoSession(credentials.email))
                setIsLoggedIn(true)
                return
            }

            const { data, error } = await supabase.auth.signInWithPassword(credentials)
            if (error) throw error

            // El formulario de login redirige en cuanto hay sesión
            setSession(data.session)
            setIsLoggedIn(true)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred'
            setError(errorMessage)
            console.error('[AuthContext] Login error:', errorMessage);
            throw error; // Re-throw para que el formulario pueda manejarlo
        } finally {
            setIsLoading(false)
        }
    };

    // Cierra la sesión en Supabase (revoca el refresh token) y siempre limpia el estado local,
    // aunque falle la red: el usuario nunca se queda con una sesión a medias.
    const logOut = async () => {
        cerrandoSesion.current = true;
        try {
            if (isDemoMode) {
                try {
                    sessionStorage.removeItem(DEMO_SESSION_KEY);
                } catch {
                    // nada que limpiar
                }
            } else {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('[AuthContext] Error al cerrar sesión:', error.message);
                    await supabase.auth.signOut({ scope: 'local' });
                }
            }
        } finally {
            reset();
            setSesionExpirada(false);
            cerrandoSesion.current = false;
            navigate('/login', { replace: true });
        }
    };

    return (
        <AuthContext.Provider value={{
            logIn,
            session,
            logOut,
            isLoading,
            isLoggedIn,
            error,
            acceso: accesoVigente ? acceso : null,
            sesionExpirada,
            reintentarAcceso,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
}
