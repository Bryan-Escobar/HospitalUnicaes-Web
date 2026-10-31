// Gestión de personal (HUNI-45): llama a /api/personal. En modo demostración trabaja sobre una copia
// en memoria con las mismas reglas que la API (código único, correo único, cuenta opcional).
import { apiFetch, ApiError } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import { responder } from '@/services/admin.service';
import type {
    ActualizarPersonalBody,
    CrearPersonalBody,
    Especialidad,
    FiltroPersonal,
    PaginaPersonal,
    Personal,
    TipoPersonal,
} from '@/types/personal.types';
import * as demo from './personal.mock';

export const PAGE_SIZE = 10;

// La API exige al menos 2 caracteres en `buscar`; con menos se lista sin filtrar.
const MIN_BUSQUEDA = 2;

export function listarPersonal(f: FiltroPersonal): Promise<PaginaPersonal> {
    if (isDemoMode) {
        return responder(demo.listar(f, PAGE_SIZE), { items: [], paginacion: { pagina: 1, por_pagina: PAGE_SIZE, total: 0, total_paginas: 0 } });
    }
    const params = new URLSearchParams({ pagina: String(f.page), por_pagina: String(PAGE_SIZE) });
    const busqueda = f.busqueda.trim();
    if (busqueda.length >= MIN_BUSQUEDA) params.set('buscar', busqueda);
    if (f.tipo !== 'todos') params.set('tipo_personal_id', f.tipo);
    if (f.estado !== 'todos') params.set('activo', String(f.estado === 'activos'));
    return apiFetch<PaginaPersonal>(`/personal?${params}`);
}

export function listarTiposPersonal(): Promise<TipoPersonal[]> {
    if (isDemoMode) return responder(demo.tipos, demo.tipos);
    return apiFetch<TipoPersonal[]>('/tipos-personal');
}

export function listarEspecialidades(): Promise<Especialidad[]> {
    if (isDemoMode) return responder(demo.especialidades, demo.especialidades);
    return apiFetch<Especialidad[]>('/especialidades');
}

export function crearPersonal(body: CrearPersonalBody): Promise<Personal> {
    if (isDemoMode) return demoMutacion(() => demo.crear(body));
    return apiFetch<Personal>('/personal', { method: 'POST', body: JSON.stringify(body) });
}

export function actualizarPersonal(id: string, body: ActualizarPersonalBody): Promise<Personal> {
    if (isDemoMode) return demoMutacion(() => demo.actualizar(id, body));
    return apiFetch<Personal>(`/personal/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

// Desactivación lógica: conserva turnos e historial y bloquea el login de su cuenta.
export function desactivarPersonal(id: string): Promise<Personal> {
    if (isDemoMode) return demoMutacion(() => demo.actualizar(id, { activo: false }));
    return apiFetch<Personal>(`/personal/${id}`, { method: 'DELETE' });
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
