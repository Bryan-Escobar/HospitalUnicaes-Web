// Avisos generales (HUNI-77): llama a /api/avisos (HUNI-74). Solo el administrador crea, edita y
// elimina; los públicos y vigentes son los que la API devuelve en /api/publico/estado.
import { apiFetch, ApiError } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import { responder } from '@/services/admin.service';
import type { ActualizarAvisoBody, Aviso, CrearAvisoBody, FiltroAvisos, PaginaAvisos } from '@/types/avisos.types';
import * as demo from './avisos.mock';

export const PAGE_SIZE = 10;

// La API recibe la vigencia en plural (vigentes, programados, vencidos, todos).
const VIGENCIA_API = { todos: 'todos', vigente: 'vigentes', programado: 'programados', vencido: 'vencidos' } as const;

const paginaVacia: PaginaAvisos = { items: [], paginacion: { pagina: 1, por_pagina: PAGE_SIZE, total: 0, total_paginas: 0 } };

export function listarAvisos(f: FiltroAvisos): Promise<PaginaAvisos> {
    if (isDemoMode) return responder(demo.listar(f, PAGE_SIZE), paginaVacia);
    const params = new URLSearchParams({
        vigencia: VIGENCIA_API[f.vigencia],
        pagina: String(f.page),
        por_pagina: String(PAGE_SIZE),
    });
    if (f.visibilidad !== 'todos') params.set('es_publico', String(f.visibilidad === 'publicos'));
    return apiFetch<PaginaAvisos>(`/avisos?${params}`);
}

export function crearAviso(body: CrearAvisoBody): Promise<Aviso> {
    if (isDemoMode) return demoMutacion(() => demo.crear(body));
    return apiFetch<Aviso>('/avisos', { method: 'POST', body: JSON.stringify(body) });
}

export function actualizarAviso(id: string, body: ActualizarAvisoBody): Promise<Aviso> {
    if (isDemoMode) return demoMutacion(() => demo.actualizar(id, body));
    return apiFetch<Aviso>(`/avisos/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

// Borrado definitivo: la API no guarda avisos eliminados.
export function eliminarAviso(id: string): Promise<{ id: string }> {
    if (isDemoMode) return demoMutacion(() => demo.eliminar(id));
    return apiFetch<{ id: string }>(`/avisos/${id}`, { method: 'DELETE' });
}

function demoMutacion<T>(accion: () => T): Promise<T> {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            try {
                resolve(accion());
            } catch (error) {
                reject(error instanceof ApiError ? error : new ApiError(500, undefined, 'Error inesperado.'));
            }
        }, 350),
    );
}
