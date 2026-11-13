import { pacientes } from './mock-data';
import type { CitaPaciente, FichaPaciente, FiltroPacientes, PacienteListado } from '@/types/pacientes.types';

const fichas: FichaPaciente[] = pacientes.map((paciente, i) => {
    const [nombres, ...apellidos] = paciente.nombre.split(' ');
    const [habitacion, cama] = paciente.habitacion?.split(' · ') ?? [];
    return {
        id: paciente.id,
        nombres: nombres ?? '',
        apellidos: apellidos.join(' '),
        activo: i < 200,
        documento_identidad: paciente.documento,
        telefono: paciente.telefono,
        fecha_nacimiento: i === 0 ? '1984-07-16' : null,
        sexo: i === 0 ? 'masculino' : null,
        direccion: null,
        contacto_emergencia: null,
        telefono_emergencia: null,
        expedientes: { numero_expediente: `EXP-${String(i + 1).padStart(4, '0')}` },
        hospitalizaciones: habitacion ? [{
            camas: {
                codigo: cama ? `${habitacion}-${cama}` : `${habitacion}-A`,
                habitaciones: { codigo: habitacion, planta: habitacion.startsWith('VIP') ? 3 : 2 },
            },
        }] : [],
    };
});

export function listarPacientes(filtro: FiltroPacientes, porPagina: number) {
    const terminos = filtro.busqueda.toLocaleLowerCase('es-SV').normalize('NFC').match(/[\p{L}\p{M}\p{N}'-]+/gu) ?? [];
    const resultados = fichas.filter((p) => {
        const campos = [p.nombres, p.apellidos, p.documento_identidad ?? ''];
        return terminos.every((termino) => campos.some((campo) => campo.toLocaleLowerCase('es-SV').includes(termino))) &&
            (filtro.estado === 'todos' || p.activo === (filtro.estado === 'activos')) &&
            (filtro.hospitalizacion === 'todas' || (p.hospitalizaciones.length > 0) === (filtro.hospitalizacion === 'hospitalizados'));
    });
    resultados.sort((a, b) => a.apellidos.localeCompare(b.apellidos, 'es-SV') || a.nombres.localeCompare(b.nombres, 'es-SV'));
    const items: PacienteListado[] = resultados.slice((filtro.page - 1) * porPagina, filtro.page * porPagina)
        .map(({ id, nombres, apellidos, activo, hospitalizaciones }) => ({ id, nombres, apellidos, activo, hospitalizaciones }));
    return { items, total: resultados.length };
}

export function obtenerFicha(id: string) {
    return fichas.find((paciente) => paciente.id === id) ?? null;
}

const citas: CitaPaciente[] = [
    { id: 'c2', fecha_hora: '2026-11-18T10:30:00-06:00', doctor_nombres: 'Ana', doctor_apellidos: 'Rivas', estado: 'confirmada' },
    { id: 'c1', fecha_hora: '2026-10-14T09:00:00-06:00', doctor_nombres: 'Ana', doctor_apellidos: 'Rivas', estado: 'atendida' },
];

export function listarCitas(id: string, page: number, porPagina: number) {
    const resultados = id === 'p1' ? citas : [];
    return { items: resultados.slice((page - 1) * porPagina, page * porPagina), total: resultados.length };
}
