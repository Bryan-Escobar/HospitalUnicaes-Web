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
            .select('id, personal_id, nombres, apellidos, tipo_personal, area, fecha, hora_inicio, hora_fin, tipo_turno, inicio, fin')
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
    if (!error) return;
    if (error.message.startsWith('TURNO_SOLAPADO:')) {
        throw new ApiError(409, 'TURNO_SOLAPADO', error.message.slice('TURNO_SOLAPADO:'.length).trim());
    }
    if (error.code === '23P01') {
        throw new ApiError(409, 'TURNO_SOLAPADO', 'El empleado ya tiene otro turno que se cruza con ese horario.');
    }
    if (error.code === '42501') {
        throw new ApiError(403, 'ACCESO_DENEGADO', 'Tu sesión no tiene permisos para registrar turnos.');
    }
    throw error;
}
