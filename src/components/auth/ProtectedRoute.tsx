import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AccesoDenegado } from '@/components/auth/AccesoDenegado';

// Rutas del panel: exigen sesión y rol Administrador con la cuenta activa.
export function ProtectedRoute() {
    const { session, isLoading, isLoggedIn, acceso } = useContext(AuthContext);
    const location = useLocation();

    // Mostrar loading mientras se verifica cualquier estado inicial
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Sin sesión: al login, recordando a dónde quería ir
    if (!session || !isLoggedIn) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!acceso) {
        return <LoadingScreen mensaje="Verificando permisos…" />;
    }

    if (acceso.estado !== 'permitido') {
        return <AccesoDenegado acceso={acceso} />;
    }

    return <Outlet />;
}
