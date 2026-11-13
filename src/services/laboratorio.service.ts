import { isDemoMode, supabase } from '@/lib/client';
import { instanteHospital, sumarDias } from '@/lib/fechas-hospital';
import { PAGE_SIZE, responder } from '@/services/admin.service';
import type { EstadoLaboratorio, Paginado } from '@/types/admin.types';
import type {
    DetalleOrdenLaboratorio,
    FiltroLaboratorio,
    OrdenLaboratorio,
    PersonaLaboratorio,
    RangoLaboratorio,
} from '@/types/laboratorio.types';
import * as demo from './laboratorio.mock';

export const ESTADOS_LABORATORIO = ['pendiente', 'en_proceso', 'completado'] as const;

const persona = 'id,nombres,apellidos';
const consulta = `consulta:consultas!inner(doctor:personal!consultas_doctor_id_fkey(${persona}),expediente:expedientes(paciente:pacientes(${persona})))`;
const examen = 'id,examen:examenes_catalogo(nombre)';
const vacio = { items: [], total: 0 };

// La sesión del administrador accede al listado mediante las políticas RLS de laboratorio.
function consultaOrdenes(rango: RangoLaboratorio, columnas: string, head = false) {
    const query = supabase.from('ordenes_laboratorio').select(columnas, { count: 'exact', head });
    if (rango.doctor) query.eq('consulta.doctor_id', rango.doctor);
    if (rango.desde) query.gte('fecha_solicitud', instanteHospital(rango.desde));
    if (rango.hasta) query.lt('fecha_solicitud', instanteHospital(sumarDias(rango.hasta, 1)));
    return query;
}

export async function listarOrdenes(filtro: FiltroLaboratorio): Promise<Paginado<OrdenLaboratorio>> {
    const offset = (filtro.page - 1) * PAGE_SIZE;
    if (isDemoMode) {
        const ordenes = demo.filtrarOrdenes(filtro).filter((orden) => filtro.estado === 'todas' || orden.estado === filtro.estado);
        return responder({ items: ordenes.slice(offset, offset + PAGE_SIZE), total: ordenes.length }, vacio);
    }

    const query = consultaOrdenes(filtro, `id,fecha_solicitud,estado,${consulta},examenes:orden_examenes(${examen})`);
    if (filtro.estado !== 'todas') query.eq('estado', filtro.estado);
    const { data, count, error } = await query
        .order('fecha_solicitud', { ascending: false }).order('id', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)
        .returns<OrdenLaboratorio[]>();
    if (error) throw error;
    return { items: data, total: count ?? 0 };
}

export async function contarOrdenes(rango: RangoLaboratorio) {
    const vacio = { pendiente: 0, en_proceso: 0, completado: 0 };
    if (isDemoMode) {
        const conteo = { ...vacio };
        for (const orden of demo.filtrarOrdenes(rango)) conteo[orden.estado] += 1;
        return responder(conteo, vacio);
    }

    const conteos = await Promise.all(ESTADOS_LABORATORIO.map(async (estado) => {
        const columnas = rango.doctor ? 'id,consulta:consultas!inner(doctor_id)' : 'id';
        const { count, error } = await consultaOrdenes(rango, columnas, true).eq('estado', estado);
        if (error) throw error;
        return [estado, count ?? 0] as const;
    }));
    return Object.fromEntries(conteos) as Record<EstadoLaboratorio, number>;
}

export async function listarDoctoresLaboratorio(): Promise<PersonaLaboratorio[]> {
    if (isDemoMode) return responder(demo.doctores, demo.doctores);

    const doctores: PersonaLaboratorio[] = [];
    const porPagina = 500;
    for (let offset = 0; ; offset += porPagina) {
        const { data, error } = await supabase.from('personal')
            .select(`${persona},consultas!consultas_doctor_id_fkey!inner(id,ordenes_laboratorio!inner(id))`)
            .limit(1, { referencedTable: 'consultas' })
            .limit(1, { referencedTable: 'consultas.ordenes_laboratorio' })
            .order('apellidos').order('nombres').order('id')
            .range(offset, offset + porPagina - 1)
            .returns<PersonaLaboratorio[]>();
        if (error) throw error;
        doctores.push(...data);
        if (data.length < porPagina) return doctores;
    }
}

export async function obtenerOrden(id: string): Promise<DetalleOrdenLaboratorio | null> {
    if (isDemoMode) return responder(demo.ordenesDemo().find((orden) => orden.id === id) ?? null, null);

    const { data, error } = await supabase.from('ordenes_laboratorio')
        .select(`id,fecha_solicitud,estado,indicaciones,${consulta},examenes:orden_examenes(${examen},estado,fecha_inicio,fecha_completado)`)
        .eq('id', id)
        .maybeSingle<DetalleOrdenLaboratorio>();
    if (error) throw error;
    return data;
}
