import type { EstadoAmbulancia } from '@/types/admin.types';

export const TIPOS_EMERGENCIA = {
    accidente: 'Accidente',
    cardiaca: 'Cardíaca',
    respiratoria: 'Respiratoria',
    neurologica: 'Neurológica',
    obstetrica: 'Obstétrica',
    intoxicacion: 'Intoxicación',
    traslado: 'Traslado',
    otra: 'Otra',
} as const;

export const ESTADOS_SOLICITUD = {
    pendiente: 'Pendiente',
    despachada: 'Despachada',
    en_curso: 'En curso',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
} as const;

export const PRIORIDADES_EMERGENCIA = { normal: 'Normal', urgente: 'Urgente', critica: 'Crítica' } as const;

type TipoEmergencia = keyof typeof TIPOS_EMERGENCIA;
type EstadoSolicitud = keyof typeof ESTADOS_SOLICITUD;
type Prioridad = keyof typeof PRIORIDADES_EMERGENCIA;

interface Persona {
    id: string;
    nombres: string;
    apellidos: string;
}

interface Emergencia {
    id: string;
    tipo_emergencia: TipoEmergencia | null;
    direccion_origen: string | null;
    latitud: number | null;
    longitud: number | null;
}

interface ServicioActivo extends Emergencia {
    estado: EstadoSolicitud;
    prioridad: Prioridad;
    fecha_despacho: string | null;
}

export interface SolicitudPendiente extends Emergencia {
    fecha_solicitud: string;
}

export interface Ambulancia {
    id: string;
    placa: string;
    estado: EstadoAmbulancia;
    ubicacion_actual: string | null;
    updated_at: string;
    solicitud_activa: ServicioActivo | null;
}

export interface EntradaBitacora {
    id: string;
    estado_anterior: EstadoAmbulancia | null;
    estado_nuevo: EstadoAmbulancia;
    descripcion: string | null;
    registrado_por: Persona | null;
    solicitud: (ServicioActivo & SolicitudPendiente & {
        canal: 'app' | 'publico';
        paciente: Persona | null;
        destino: string | null;
        descripcion_emergencia: string | null;
        fecha_cierre: string | null;
    }) | null;
    created_at: string;
}

export interface FiltroBitacora {
    desde: string;
    hasta: string;
    estado: EstadoAmbulancia | '';
    tipo: TipoEmergencia | '';
    page: number;
}
