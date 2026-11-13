export interface FiltroPacientes {
    busqueda: string;
    estado: 'todos' | 'activos' | 'inactivos';
    hospitalizacion: 'todas' | 'hospitalizados' | 'ambulatorios';
    page: number;
}

export interface HabitacionActual {
    camas: {
        codigo: string;
        habitaciones: { codigo: string; planta: number };
    };
}

export interface PacienteListado {
    id: string;
    nombres: string;
    apellidos: string;
    activo: boolean;
    hospitalizaciones: HabitacionActual[];
}

export interface FichaPaciente extends PacienteListado {
    documento_identidad: string | null;
    telefono: string | null;
    fecha_nacimiento: string | null;
    sexo: 'masculino' | 'femenino' | 'otro' | null;
    direccion: string | null;
    contacto_emergencia: string | null;
    telefono_emergencia: string | null;
    expedientes: { numero_expediente: string } | null;
}

export interface CitaPaciente {
    id: string;
    fecha_hora: string;
    doctor_nombres: string;
    doctor_apellidos: string;
    estado: 'programada' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';
}
