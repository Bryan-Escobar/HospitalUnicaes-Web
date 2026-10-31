export interface LoginRequest {
    email: string;
    password: string;
}

// Roles de la API (HUNI-95). Al panel Web solo entra `administrador`.
export type Rol = 'administrador' | 'doctor' | 'recepcionista' | 'paciente';

export const ROL_ETIQUETA: Record<Rol, string> = {
    administrador: 'Administrador',
    doctor: 'Doctor',
    recepcionista: 'Recepcionista / Asistente',
    paciente: 'Paciente',
};

// Respuesta de GET /api/auth/me (MeSchema en HospitalUnicaes-Api).
export interface Me {
    id: string;
    email: string | null;
    nombres: string;
    apellidos: string;
    telefono: string | null;
    avatar_url: string | null;
    rol: Rol;
    activo: boolean;
    created_at: string;
    paciente_id: string | null;
    personal: {
        id: string;
        tipo: string;
        especialidad: string | null;
        codigo_empleado: string;
    } | null;
}

/**
 * Resultado de verificar el acceso de la sesión al panel, ligado al usuario que se verificó
 * para no reutilizar el resultado de otra cuenta.
 * - permitido: rol administrador y cuenta activa
 * - denegado:  otro rol (403 ACCESO_DENEGADO o rol distinto)
 * - inactivo:  403 CUENTA_INACTIVA
 * - incompleto: 403 PERFIL_INCOMPLETO (la cuenta no tiene su registro en `personal`)
 * - error:     no se pudo consultar la API (red, 5xx u otra respuesta)
 */
export type EstadoAcceso =
    | { userId: string; estado: 'permitido'; perfil: Me }
    | { userId: string; estado: 'denegado'; perfil: Me | null }
    | { userId: string; estado: 'inactivo' }
    | { userId: string; estado: 'incompleto' }
    | { userId: string; estado: 'error'; mensaje: string };
