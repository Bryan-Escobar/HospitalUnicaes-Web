export const TIPOS_TURNO = {
    manana: 'Mañana',
    tarde: 'Tarde',
    noche: 'Noche',
    guardia: 'Guardia',
};

export interface CrearTurnoBody {
    personal_id: string;
    area: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    tipo_turno: keyof typeof TIPOS_TURNO;
}

// Contrato de la vista v_turnos de Supabase (HUNI-51).
export interface Turno extends CrearTurnoBody {
    id: string;
    nombres: string;
    apellidos: string;
    tipo_personal: string;
    inicio: string;
    fin: string;
}
