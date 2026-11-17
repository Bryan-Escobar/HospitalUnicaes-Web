import { apiFetch } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import { PAGE_SIZE, responder } from '@/services/admin.service';
import type { Ambulancia, EntradaBitacora, FiltroBitacora, SolicitudPendiente } from '@/types/ambulancia.types';
import type { Paginado } from '@/types/admin.types';
import * as demo from './ambulancia.mock';

interface PaginaApi<T> {
    items: T[];
    paginacion: { total: number };
}

export function obtenerAmbulancia(signal?: AbortSignal): Promise<Ambulancia> {
    if (isDemoMode) {
        const ambulancia = demo.obtenerAmbulancia();
        return responder(ambulancia, ambulancia);
    }
    return apiFetch<Ambulancia>('/ambulancia', { signal, cache: 'no-store' });
}

export function cambiarEstadoAmbulancia(estado: 'disponible' | 'en_mantenimiento'): Promise<Ambulancia> {
    if (isDemoMode) return demo.cambiarEstado(estado);
    return apiFetch<Ambulancia>('/ambulancia/estado', {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    });
}

export async function listarSolicitudesPendientes(): Promise<Paginado<SolicitudPendiente>> {
    if (isDemoMode) return responder(demo.solicitudesPendientes, { items: [], total: 0 });
    const { items, paginacion } = await apiFetch<PaginaApi<SolicitudPendiente>>(
        `/ambulancia/solicitudes?estado=pendiente&por_pagina=${PAGE_SIZE}`,
        { cache: 'no-store' },
    );
    return { items, total: paginacion.total };
}

export async function listarBitacora(filtro: FiltroBitacora): Promise<Paginado<EntradaBitacora>> {
    if (isDemoMode) return responder(demo.listarBitacora(filtro), { items: [], total: 0 });
    const query = new URLSearchParams({ pagina: String(filtro.page), por_pagina: String(PAGE_SIZE) });
    if (filtro.desde) query.set('desde', filtro.desde);
    if (filtro.hasta) query.set('hasta', filtro.hasta);
    if (filtro.estado) query.set('estado', filtro.estado);
    if (filtro.tipo) query.set('tipo_emergencia', filtro.tipo);
    const { items, paginacion } = await apiFetch<PaginaApi<EntradaBitacora>>(`/ambulancia/bitacora?${query}`, { cache: 'no-store' });
    return { items, total: paginacion.total };
}
