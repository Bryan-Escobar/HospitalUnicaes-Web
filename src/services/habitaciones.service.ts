import { apiFetch } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import { responder } from '@/services/admin.service';
import { listarPersonal, listarTiposPersonal } from '@/services/personal.service';
import { useDemoStore } from '@/store/useDemoStore';
import type { Habitacion, OperacionCama } from '@/types/habitaciones.types';
import * as demo from './habitaciones.mock';

export function listarHabitaciones(signal: AbortSignal): Promise<Habitacion[]> {
    if (isDemoMode) return responder(demo.listar('datos'), demo.listar('vacio'));
    return apiFetch<Habitacion[]>('/habitaciones', { signal });
}

export async function listarMedicosActivos() {
    const tipos = (await listarTiposPersonal()).filter((tipo) => tipo.es_medico && tipo.activo);
    const grupos = await Promise.all(tipos.map(async (tipo) => {
        const medicos = [];
        for (let page = 1; ; page += 1) {
            const { items, paginacion } = await listarPersonal({ page, busqueda: '', estado: 'activos', tipo: tipo.id });
            medicos.push(...items);
            if (page >= paginacion.total_paginas) return medicos;
        }
    }));
    return grupos.flat().sort((a, b) => a.apellidos.localeCompare(b.apellidos, 'es-SV') || a.nombres.localeCompare(b.nombres, 'es-SV'));
}

export async function gestionarCama(operacion: OperacionCama): Promise<void> {
    if (isDemoMode) {
        demo.gestionar(useDemoStore.getState().mode === 'vacio' ? 'vacio' : 'datos', operacion);
        return;
    }

    switch (operacion.tipo) {
        case 'ingreso':
            await apiFetch('/hospitalizaciones', {
                method: 'POST',
                body: JSON.stringify({
                    cama_id: operacion.camaId,
                    paciente_id: operacion.paciente.id,
                    doctor_tratante_id: operacion.medicoId,
                    motivo_ingreso: operacion.motivo.trim() || undefined,
                }),
            });
            break;
        case 'traslado':
            await apiFetch(`/hospitalizaciones/${operacion.hospitalizacionId}/traslado`, {
                method: 'POST', body: JSON.stringify({ cama_id: operacion.destinoId }),
            });
            break;
        case 'alta':
            await apiFetch(`/hospitalizaciones/${operacion.hospitalizacionId}/alta`, {
                method: 'POST', body: JSON.stringify({ notas: operacion.notas.trim() || undefined }),
            });
            break;
        case 'limpieza':
            await apiFetch(`/camas/${operacion.camaId}/estado`, {
                method: 'PATCH', body: JSON.stringify({ estado: 'disponible' }),
            });
    }
}
