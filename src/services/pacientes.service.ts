import { isDemoMode, supabase } from '@/lib/client';
import { responder } from '@/services/admin.service';
import type { Paginado } from '@/types/admin.types';
import type { CitaPaciente, FichaPaciente, FiltroPacientes, PacienteListado } from '@/types/pacientes.types';
import * as demo from './pacientes.mock';

export const PACIENTES_POR_PAGINA = 10;
export const CITAS_POR_PAGINA = 5;

const columnasListado = 'id,nombres,apellidos,activo,hospitalizaciones(camas(codigo,habitaciones(codigo,planta)))';
const columnasFicha = `${columnasListado},documento_identidad,telefono,fecha_nacimiento,sexo,direccion,contacto_emergencia,telefono_emergencia,expedientes(numero_expediente)`;
const vacio = { items: [], total: 0 };

// Las consultas usan la sesión del usuario y las políticas RLS de las tablas privadas.
export async function listarPacientes(filtro: FiltroPacientes): Promise<Paginado<PacienteListado>> {
    if (isDemoMode) return responder(demo.listarPacientes(filtro, PACIENTES_POR_PAGINA), vacio);

    const consulta = supabase.from('pacientes').select(columnasListado, { count: 'exact' })
        .is('hospitalizaciones.fecha_alta', null);

    if (filtro.estado !== 'todos') consulta.eq('activo', filtro.estado === 'activos');
    if (filtro.hospitalizacion === 'hospitalizados') consulta.not('hospitalizaciones', 'is', null);
    if (filtro.hospitalizacion === 'ambulatorios') consulta.is('hospitalizaciones', null);

    // Cada término puede coincidir con nombre, apellido o DUI. La lista de caracteres evita
    // interpretar la búsqueda como sintaxis de filtros o comodines de PostgREST.
    const terminos = filtro.busqueda.normalize('NFC').match(/[\p{L}\p{M}\p{N}'-]+/gu) ?? [];
    for (const termino of terminos) {
        const patron = `*${termino}*`;
        consulta.or(`nombres.ilike.${patron},apellidos.ilike.${patron},documento_identidad.ilike.${patron}`);
    }

    const desde = (filtro.page - 1) * PACIENTES_POR_PAGINA;
    const { data, count, error } = await consulta
        .order('apellidos').order('nombres').order('id')
        .range(desde, desde + PACIENTES_POR_PAGINA - 1)
        .returns<PacienteListado[]>();
    if (error) throw error;
    return { items: data, total: count ?? 0 };
}

export async function obtenerFichaPaciente(id: string): Promise<FichaPaciente | null> {
    if (isDemoMode) return responder(demo.obtenerFicha(id), null);

    const { data, error } = await supabase.from('pacientes').select(columnasFicha)
        .eq('id', id)
        .is('hospitalizaciones.fecha_alta', null)
        .maybeSingle<FichaPaciente>();
    if (error) throw error;
    return data;
}

export async function listarCitasPaciente(id: string, page: number): Promise<Paginado<CitaPaciente>> {
    if (isDemoMode) return responder(demo.listarCitas(id, page, CITAS_POR_PAGINA), vacio);

    const desde = (page - 1) * CITAS_POR_PAGINA;
    const { data, count, error } = await supabase.from('v_citas')
        .select('id,fecha_hora,doctor_nombres,doctor_apellidos,estado', { count: 'exact' })
        .eq('paciente_id', id)
        .order('fecha_hora', { ascending: false }).order('id')
        .range(desde, desde + CITAS_POR_PAGINA - 1)
        .returns<CitaPaciente[]>();
    if (error) throw error;
    return { items: data, total: count ?? 0 };
}
