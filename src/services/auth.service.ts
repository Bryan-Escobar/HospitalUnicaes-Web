import { apiFetch, ApiError } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import type { EstadoAcceso, Me, Rol } from '@/types/auth.types';

const ROLES: Rol[] = ['administrador', 'doctor', 'recepcionista', 'paciente'];

// En modo demostración el rol sale del correo (doctor@…, paciente@…) para poder probar el acceso
// denegado; cualquier otro correo entra como administrador.
function meDemo(email: string): Me {
    const prefijo = email.split('@')[0]?.toLowerCase() as Rol;
    return {
        id: email,
        email,
        nombres: 'Rosa',
        apellidos: 'Guzmán',
        telefono: null,
        avatar_url: null,
        rol: ROLES.includes(prefijo) ? prefijo : 'administrador',
        activo: prefijo !== ('inactivo' as Rol),
        created_at: new Date().toISOString(),
        paciente_id: null,
        personal: null,
    };
}

export function obtenerMe(email: string): Promise<Me> {
    if (isDemoMode) return Promise.resolve(meDemo(email));
    return apiFetch<Me>('/auth/me');
}

// Decide si la sesión puede usar el panel Web: solo administradores con la cuenta activa.
export async function verificarAcceso(userId: string, email: string): Promise<EstadoAcceso> {
    try {
        const perfil = await obtenerMe(email);
        if (!perfil.activo) return { userId, estado: 'inactivo' };
        if (perfil.rol !== 'administrador') return { userId, estado: 'denegado', perfil };
        return { userId, estado: 'permitido', perfil };
    } catch (error) {
        // La API usa 403 para varias causas: se distingue por `code`, nunca solo por el status.
        if (error instanceof ApiError) {
            if (error.code === 'CUENTA_INACTIVA') return { userId, estado: 'inactivo' };
            if (error.code === 'PERFIL_INCOMPLETO') return { userId, estado: 'incompleto' };
            if (error.code === 'ACCESO_DENEGADO') return { userId, estado: 'denegado', perfil: null };
        }
        const mensaje = error instanceof Error ? error.message : 'No se pudo verificar tu cuenta.';
        return { userId, estado: 'error', mensaje };
    }
}
