import { ApiError } from '@/lib/api';
import { isDemoMode, supabase } from '@/lib/client';
import { instanteHospital } from '@/lib/fechas-hospital';
import { responder } from '@/services/admin.service';
import { listarPersonal } from '@/services/personal.service';
import type { Personal } from '@/types/personal.types';
import type { CrearTurnoBody, Turno } from '@/types/turnos.types';
import * as demo from './turnos.mock';

export async function listarTurnos(desde: string, hasta: string): Promise<Turno[]> {
    if (isDemoMode) return responder(demo.listar(desde, hasta), demo.listar(desde, hasta, false));

    const porPagina = 500;
    const turnos: Turno[] = [];
    for (let offset = 0; ; offset += porPagina) {
        const { data, error } = await supabase
            .from('v_turnos')
            .select('id, personal_id, nombres, apellidos, tipo_personal, area, fecha, hora_inicio, hora_fin, tipo_turno, inicio, fin, estado_asistencia')
            .lt('inicio', instanteHospital(hasta))
            .gt('fin', instanteHospital(desde))
            .order('inicio')
            .order('id')
            .range(offset, offset + porPagina - 1)
            .returns<Turno[]>();
        if (error) throw error;
        turnos.push(...data);
        if (data.length < porPagina) return turnos;
    }
}

export async function listarPersonalParaTurnos(): Promise<Personal[]> {
    const personal: Personal[] = [];
    for (let page = 1; ; page += 1) {
        const { items, paginacion } = await listarPersonal({ page, busqueda: '', estado: 'activos', tipo: 'todos' });
        personal.push(...items);
        if (page >= paginacion.total_paginas) return personal;
    }
}

export async function crearTurno(body: CrearTurnoBody): Promise<void> {
    if (isDemoMode) return demo.crear(body);

    const { error } = await supabase.from('turnos_personal').insert(body);
    if (error) lanzarErrorTurno(error);
}

export async function actualizarTurno(id: string, body: CrearTurnoBody): Promise<void> {
    if (isDemoMode) return demo.actualizar(id, body);

    const { data, error } = await supabase.from('turnos_personal')
        .update(body).eq('id', id).select('id').maybeSingle();
    if (error) lanzarErrorTurno(error);
    if (!data) throw new ApiError(404, 'TURNO_NO_ENCONTRADO', 'El turno ya no está disponible.');
}

export async function eliminarTurno(id: string): Promise<void> {
    if (isDemoMode) return demo.eliminar(id);

    const { data, error } = await supabase.from('turnos_personal')
        .delete().eq('id', id).select('id').maybeSingle();
    if (error) lanzarErrorTurno(error);
    if (!data) throw new ApiError(404, 'TURNO_NO_ENCONTRADO', 'El turno ya no está disponible.');
}

function lanzarErrorTurno(error: { code: string; message: string }): never {
    if (error.message.startsWith('TURNO_HISTORICO:')) {
        throw new ApiError(409, 'TURNO_HISTORICO', error.message.slice('TURNO_HISTORICO:'.length).trim());
    }
    if (error.message.startsWith('TURNO_SOLAPADO:')) {
        throw new ApiError(409, 'TURNO_SOLAPADO', error.message.slice('TURNO_SOLAPADO:'.length).trim());
    }
    if (error.code === '23P01') {
        throw new ApiError(409, 'TURNO_SOLAPADO', 'El empleado ya tiene otro turno que se cruza con ese horario.');
    }
    if (error.message.startsWith('AREA_INVALIDA:')) {
        throw new ApiError(422, 'AREA_INVALIDA', error.message.slice('AREA_INVALIDA:'.length).trim());
    }
    if (error.code === '42501') {
        throw new ApiError(403, 'ACCESO_DENEGADO', 'Tu sesión no tiene permisos para gestionar turnos.');
    }
    throw error;
}
