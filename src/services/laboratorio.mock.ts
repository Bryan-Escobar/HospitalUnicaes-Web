import { fechaHospital, instanteHospital, sumarDias } from '@/lib/fechas-hospital';
import type { DetalleOrdenLaboratorio, RangoLaboratorio } from '@/types/laboratorio.types';

export const doctores = [
    { id: 'molina', nombres: 'Carlos', apellidos: 'Molina' },
    { id: 'pena', nombres: 'Ana', apellidos: 'Peña' },
    { id: 'rivas', nombres: 'Sofía', apellidos: 'Rivas' },
];

const pacientes = [
    { id: 'luis', nombres: 'Luis', apellidos: 'Martínez' },
    { id: 'maria', nombres: 'María', apellidos: 'López' },
    { id: 'elena', nombres: 'Elena', apellidos: 'Cruz' },
];
const examenes = ['Examen general de orina', 'Hemograma completo', 'Química sanguínea'];
const estados = ['en_proceso', 'pendiente', 'completado'] as const;

export function ordenesDemo(hoy = fechaHospital()): DetalleOrdenLaboratorio[] {
    return Array.from({ length: 27 }, (_, i) => {
        const id = String(1042 - i);
        const fecha = sumarDias(hoy, -Math.floor(i / 3));
        const doctor = doctores[i % doctores.length]!;
        const paciente = pacientes[i % pacientes.length]!;
        const estado = estados[(i + Math.floor(i / 3)) % estados.length]!;
        return {
            id,
            fecha_solicitud: instanteHospital(fecha, '08:00'),
            estado,
            consulta: { doctor, expediente: { paciente } },
            indicaciones: null,
            examenes: [{
                id: `${id}-1`,
                examen: { nombre: examenes[i % examenes.length]! },
                estado,
                fecha_inicio: estado === 'pendiente' ? null : instanteHospital(fecha, '09:00'),
                fecha_completado: estado === 'completado' ? instanteHospital(fecha, '10:00') : null,
            }],
        };
    });
}

export function filtrarOrdenes(rango: RangoLaboratorio) {
    return ordenesDemo().filter((orden) => {
        const fecha = orden.fecha_solicitud.slice(0, 10);
        return (!rango.doctor || orden.consulta.doctor.id === rango.doctor)
            && (!rango.desde || fecha >= rango.desde)
            && (!rango.hasta || fecha <= rango.hasta);
    });
}
