// Avisos generales (HUNI-74 en la API, HUNI-77 en la web). Mismos nombres de campo que /api/avisos.

export type VigenciaAviso = 'vigente' | 'programado' | 'vencido';

export interface Aviso {
    id: string;
    titulo: string;
    contenido: string;
    es_publico: boolean;
    fecha_publicacion: string; // ISO 8601
    fecha_expiracion: string | null; // null = no expira
    vigencia: VigenciaAviso;
    autor: { id: string; nombres: string; apellidos: string };
}

export interface PaginaAvisos {
    items: Aviso[];
    paginacion: { pagina: number; por_pagina: number; total: number; total_paginas: number };
}

// Los dos filtros se combinan: p. ej. públicos programados.
export type FiltroVigencia = 'todos' | VigenciaAviso;
export type FiltroVisibilidad = 'todos' | 'publicos' | 'internos';

export interface FiltroAvisos {
    vigencia: FiltroVigencia;
    visibilidad: FiltroVisibilidad;
    page: number;
}

export interface CrearAvisoBody {
    titulo: string;
    contenido: string;
    es_publico: boolean;
    fecha_publicacion: string;
    fecha_expiracion: string | null;
}

export type ActualizarAvisoBody = Partial<CrearAvisoBody>;
