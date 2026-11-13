import type { EstadoLaboratorio } from '@/types/admin.types';

export interface PersonaLaboratorio {
    id: string;
    nombres: string;
    apellidos: string;
}

export interface RangoLaboratorio {
    doctor: string;
    desde: string;
    hasta: string;
}

export interface FiltroLaboratorio extends RangoLaboratorio {
    estado: EstadoLaboratorio | 'todas';
    page: number;
}

export interface OrdenLaboratorio {
    id: string;
    fecha_solicitud: string;
    estado: EstadoLaboratorio;
    consulta: { doctor: PersonaLaboratorio; expediente: { paciente: PersonaLaboratorio } };
    examenes: { id: string; examen: { nombre: string } }[];
}

export interface DetalleOrdenLaboratorio extends OrdenLaboratorio {
    indicaciones: string | null;
    examenes: (OrdenLaboratorio['examenes'][number] & {
        estado: EstadoLaboratorio;
        fecha_inicio: string | null;
        fecha_completado: string | null;
    })[];
}
