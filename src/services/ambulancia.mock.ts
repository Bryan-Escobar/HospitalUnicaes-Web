import { fechaHospital, instanteHospital, sumarDias } from '@/lib/fechas-hospital';
import { PAGE_SIZE, responder } from '@/services/admin.service';
import type { Ambulancia, EntradaBitacora, FiltroBitacora, SolicitudPendiente } from '@/types/ambulancia.types';
import type { Paginado } from '@/types/admin.types';

const ayer = sumarDias(fechaHospital(), -1);
const paciente = { id: 'paciente-demo', nombres: 'Luis', apellidos: 'Martínez' };
const recepcionista = { id: 'recepcion-demo', nombres: 'Karla', apellidos: 'Flores' };
const solicitud = {
    id: 'emergencia-demo',
    tipo_emergencia: 'cardiaca',
    canal: 'app',
    estado: 'finalizada',
    prioridad: 'urgente',
    paciente,
    direccion_origen: 'Col. Escalón, San Salvador',
    latitud: null,
    longitud: null,
    destino: 'Emergencias del hospital',
    descripcion_emergencia: 'Dolor de pecho',
    fecha_solicitud: instanteHospital(ayer, '10:12'),
    fecha_despacho: instanteHospital(ayer, '10:14'),
    fecha_cierre: instanteHospital(ayer, '11:02'),
} as const;

let ambulancia: Ambulancia = {
    id: 'ambulancia-demo',
    placa: 'AMB-001',
    estado: 'disponible',
    updated_at: solicitud.fecha_cierre,
    ubicacion_actual: null,
    solicitud_activa: null,
};

const bitacora: EntradaBitacora[] = [
    {
        id: 'cierre-demo',
        estado_anterior: 'en_servicio',
        estado_nuevo: 'disponible',
        descripcion: 'Servicio finalizado',
        registrado_por: recepcionista,
        solicitud,
        created_at: solicitud.fecha_cierre,
    },
    {
        id: 'despacho-demo',
        estado_anterior: 'disponible',
        estado_nuevo: 'en_servicio',
        descripcion: 'Ambulancia despachada',
        registrado_por: recepcionista,
        solicitud,
        created_at: solicitud.fecha_despacho,
    },
];

export const solicitudesPendientes: Paginado<SolicitudPendiente> = { items: [], total: 0 };

export function obtenerAmbulancia(): Ambulancia {
    return ambulancia;
}

export async function cambiarEstado(estado: 'disponible' | 'en_mantenimiento'): Promise<Ambulancia> {
    await responder(null, null);
    if (ambulancia.estado === estado || ambulancia.estado === 'en_servicio') return ambulancia;
    const fecha = new Date().toISOString();
    bitacora.unshift({
        id: crypto.randomUUID(),
        estado_anterior: ambulancia.estado,
        estado_nuevo: estado,
        descripcion: estado === 'en_mantenimiento' ? 'Inicio de mantenimiento' : 'Fin de mantenimiento',
        registrado_por: null,
        solicitud: null,
        created_at: fecha,
    });
    ambulancia = { ...ambulancia, estado, updated_at: fecha };
    return ambulancia;
}

export function listarBitacora(filtro: FiltroBitacora): Paginado<EntradaBitacora> {
    const registros = bitacora.filter((entrada) => {
        const fecha = fechaHospital(new Date(entrada.created_at));
        return (!filtro.desde || fecha >= filtro.desde)
            && (!filtro.hasta || fecha <= filtro.hasta)
            && (!filtro.estado || entrada.estado_nuevo === filtro.estado)
            && (!filtro.tipo || entrada.solicitud?.tipo_emergencia === filtro.tipo);
    });
    const offset = (filtro.page - 1) * PAGE_SIZE;
    return { items: registros.slice(offset, offset + PAGE_SIZE), total: registros.length };
}
