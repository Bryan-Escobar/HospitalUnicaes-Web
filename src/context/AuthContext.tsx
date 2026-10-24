import { createContext, useEffect, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from 'react-router-dom';
import type { LoginRequest } from "@/types/auth.types";
import { useAuthStore } from "@/store/useAuthStore";
import { isDemoMode, supabase } from "@/lib/client";

const DEMO_SESSION_KEY = "hu-demo-session";

// Sesión mínima para el modo demostración (sin Supabase configurado).
function demoSession(email: string): Session {
    return { user: { email, user_metadata: {} } } as unknown as Session;
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
    logOut: () => Promise<void>;
    logIn: (credentials: LoginRequest) => Promise<void>;
    clearError: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
    session: null,
    isLoading: true,
    isLoggedIn: false,
    error: null,
    logOut: async () => { },
    logIn: async () => { },
    clearError: () => { },
});

export function AuthProvider({ children }: PropsWithChildren) {
    const navigate = useNavigate();

    // Obtener estados del store
    const session = useAuthStore((state) => state.session);
    const isLoading = useAuthStore((state) => state.isLoading);
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    const error = useAuthStore((state) => state.error);

    // Obtener funciones del store
    const setSession = useAuthStore((state) => state.setSession);
    const setIsLoggedIn = useAuthStore((state) => state.setIsLoggedIn);
    const setIsLoading = useAuthStore((state) => state.setIsLoading);
    const setError = useAuthStore((state) => state.setError);

    const clearError = () => setError(null);


    useEffect(() => {
        console.log("[AuthContext] Starting auth initialization...");

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
                // uncommment to debug
                // console.log("[AuthContext] Session loaded:", data.session);
                setSession(data.session);
                setIsLoggedIn(!!data.session);
            })
            .catch((error: any) => {
                console.error("[AuthContext] Error getting session:", error);
                setIsLoggedIn(false);
            })
            .finally(() => {
                console.log("[AuthContext] Setting isLoading to false");
                setIsLoading(false);
            });

        // Suscripción a cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("[AuthContext] Auth state changed:", event, session?.user?.email);
            setSession(session);
            setIsLoggedIn(!!session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate, setIsLoading, setIsLoggedIn, setSession]);

    const logIn = async (credentials: LoginRequest) => {
        setIsLoading(true)
        setError(null)

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
                navigate('/dashboard')
                return
            }

            const { error } = await supabase.auth.signInWithPassword(credentials)
            if (error) throw error

            // La sesión se actualizará automáticamente a través del listener onAuthStateChange
            console.log("[AuthContext] Login successful");
            navigate('/dashboard');

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred'
            setError(errorMessage)
            console.error('[AuthContext] Login error:', errorMessage);
            throw error; // Re-throw para que el formulario pueda manejarlo
        } finally {
            setIsLoading(false)
        }
    };

    const logOut = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (isDemoMode) {
                try {
                    sessionStorage.removeItem(DEMO_SESSION_KEY);
                } catch {
                    // nada que limpiar
                }
                setIsLoggedIn(false);
                setSession(null);
                navigate('/login');
                return;
            }

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('[AuthContext] Error al cerrar sesión:', error.message);
                setError(error.message);
                return;
            }

            // Limpiar el estado local
            setIsLoggedIn(false);
            setSession(null);
            console.log("[AuthContext] Logout successful");

            // Navegar al login
            navigate('/login');

        } catch (error: any) {
            console.error('[AuthContext] Error', error.message);
            setError(error.message);
        } finally {
            setIsLoading(false);
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
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
}