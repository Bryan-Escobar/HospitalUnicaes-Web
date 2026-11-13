import { ApiError } from '@/lib/api';
import { fechaHospital, instanteHospital, lunesDe, sumarDias } from '@/lib/fechas-hospital';
import type { CrearTurnoBody, Turno } from '@/types/turnos.types';
import * as personalDemo from './personal.mock';

const semilla = [
    { personal_id: 'demo-2', area: 'Consulta externa', hora_inicio: '07:00', hora_fin: '15:00', tipo_turno: 'manana' },
    { personal_id: 'demo-3', area: 'Recepción', hora_inicio: '07:00', hora_fin: '15:00', tipo_turno: 'manana' },
    { personal_id: 'demo-4', area: 'Hospitalización', hora_inicio: '07:00', hora_fin: '15:00', tipo_turno: 'manana' },
    { personal_id: 'demo-6', area: 'Emergencia', hora_inicio: '19:00', hora_fin: '07:00', tipo_turno: 'noche' },
    { personal_id: 'demo-8', area: 'Alergología', hora_inicio: '08:00', hora_fin: '12:00', tipo_turno: 'manana' },
    { personal_id: 'demo-14', area: 'Recepción', hora_inicio: '15:00', hora_fin: '23:00', tipo_turno: 'tarde' },
] satisfies Omit<CrearTurnoBody, 'fecha'>[];

function conIntervalo(body: CrearTurnoBody, id: string) {
    const { fecha, hora_inicio, hora_fin } = body;
    const diaFin = hora_fin < hora_inicio ? sumarDias(fecha, 1) : fecha;
    return {
        ...body,
        id,
        inicio: instanteHospital(fecha, hora_inicio),
        fin: instanteHospital(diaFin, hora_fin),
    };
}

const lunes = lunesDe(fechaHospital());
const ejemplos = semilla.flatMap((turno, i) =>
    [0, 2, 4].map((dia) => conIntervalo({ ...turno, fecha: sumarDias(lunes, dia) }, `ejemplo-${i}-${dia}`)),
);
const registrados: ReturnType<typeof conIntervalo>[] = [];

export function listar(desde: string, hasta: string, conEjemplos = true): Turno[] {
    const inicio = Date.parse(instanteHospital(desde));
    const fin = Date.parse(instanteHospital(hasta));
    return (conEjemplos ? [...ejemplos, ...registrados] : registrados).flatMap((t) => {
        if (Date.parse(t.inicio) >= fin || Date.parse(t.fin) <= inicio) return [];
        const p = personalDemo.obtener(t.personal_id);
        if (!p) return [];
        return [{ ...t, nombres: p.nombres, apellidos: p.apellidos, tipo_personal: p.tipo.nombre }];
    });
}

export function crear(body: CrearTurnoBody) {
    if (!personalDemo.obtener(body.personal_id)?.activo) {
        throw new ApiError(422, 'VALIDACION', 'Selecciona un miembro activo del personal.');
    }

    const turno = conIntervalo(body, `turno-${registrados.length + 1}`);
    const inicio = Date.parse(turno.inicio);
    const fin = Date.parse(turno.fin);
    if ([...ejemplos, ...registrados].some((t) =>
        t.personal_id === turno.personal_id && Date.parse(t.inicio) < fin && Date.parse(t.fin) > inicio,
    )) {
        throw new ApiError(409, 'TURNO_SOLAPADO', 'El empleado ya tiene otro turno que se cruza con ese horario.');
    }
    registrados.push(turno);
}
