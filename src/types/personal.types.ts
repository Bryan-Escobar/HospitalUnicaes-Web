// Contrato de /api/personal, /api/tipos-personal y /api/especialidades (personal.dto.ts y
// personal.validator.ts en HospitalUnicaes-Api).
import type { Rol } from '@/types/auth.types';

export type RolPersonal = Exclude<Rol, 'paciente'>;

export interface TipoPersonal {
    id: string;
    nombre: string;
    // Rol que recibe la cuenta de un empleado de este tipo; null = este tipo no puede tener cuenta.
    rol_sugerido: Rol | null;
    es_medico: boolean;
    activo: boolean;
}

export interface Especialidad {
    id: string;
    nombre: string;
    descripcion: string | null;
}

export interface Personal {
    id: string;
    // Cuenta de acceso. null = empleado sin login, solo aparece en turnos.
    perfil_id: string | null;
    nombres: string;
    apellidos: string;
    email: string | null;
    telefono: string | null;
    rol: Rol | null;
    tipo: { id: string; nombre: string };
    especialidad: { id: string; nombre: string } | null;
    codigo_empleado: string;
    num_licencia: string | null;
    fecha_contratacion: string | null;
    activo: boolean;
}

export interface DatosPersonal {
    nombres: string;
    apellidos: string;
    telefono?: string;
    tipo_personal_id: string;
    especialidad_id?: string | null;
    codigo_empleado: string;
    num_licencia?: string | null;
    fecha_contratacion?: string | null;
}

// Sin `email` el empleado se crea sin cuenta. Con `email`, `password` es obligatoria.
export interface CrearPersonalBody extends DatosPersonal {
    email?: string;
    password?: string;
    rol?: RolPersonal;
}

export type ActualizarPersonalBody = Partial<DatosPersonal> & { activo?: boolean; rol?: RolPersonal };

export interface FiltroPersonal {
    busqueda: string;
    tipo: string;
    estado: 'activos' | 'inactivos' | 'todos';
    page: number;
}

export interface PaginaPersonal {
    items: Personal[];
    paginacion: { pagina: number; por_pagina: number; total: number; total_paginas: number };
}
