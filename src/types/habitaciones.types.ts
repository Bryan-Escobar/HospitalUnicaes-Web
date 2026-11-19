export interface PersonaResumen {
    id: string;
    nombres: string;
    apellidos: string;
}

export type EstadoCama = 'disponible' | 'ocupada' | 'limpieza' | 'mantenimiento';

export interface Cama {
    id: string;
    codigo: string;
    estado: EstadoCama;
    ocupante: { hospitalizacion_id: string; paciente: PersonaResumen } | null;
}

export interface Habitacion {
    id: string;
    codigo: string;
    planta: 2 | 3;
    activa: boolean;
    camas: Cama[];
}

export type OperacionCama =
    | { tipo: 'ingreso'; camaId: string; paciente: PersonaResumen; medicoId: string; motivo: string }
    | { tipo: 'traslado'; hospitalizacionId: string; destinoId: string }
    | { tipo: 'alta'; hospitalizacionId: string; notas: string }
    | { tipo: 'limpieza'; camaId: string };
