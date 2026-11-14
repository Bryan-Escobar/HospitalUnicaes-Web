// Avisos de demostración en memoria, con fechas relativas a hoy para que siempre haya uno de cada vigencia.
import { ApiError } from '@/lib/api';
import type { ActualizarAvisoBody, Aviso, CrearAvisoBody, FiltroAvisos, PaginaAvisos, VigenciaAviso } from '@/types/avisos.types';

const DIA = 24 * 60 * 60 * 1000;
const autor = { id: 'demo-admin', nombres: 'Andrea', apellidos: 'Méndez Ruiz' };
const desde = (dias: number) => new Date(Date.now() + dias * DIA).toISOString();

type AvisoGuardado = Omit<Aviso, 'vigencia'>;

let avisos: AvisoGuardado[] = [];

export function reiniciar() {
    avisos = [
        {
            id: 'a1',
            titulo: 'Horario de visitas',
            contenido: 'Las visitas son de 2:00 a 6:00 p. m., con un máximo de dos personas por paciente.',
            es_publico: true,
            fecha_publicacion: desde(-20),
            fecha_expiracion: null,
            autor,
        },
        {
            id: 'a2',
            titulo: 'Reunión clínica mensual',
            contenido: 'Auditorio del tercer piso, el jueves a las 7:00 a. m. Asistencia obligatoria para jefaturas.',
            es_publico: false,
            fecha_publicacion: desde(-2),
            fecha_expiracion: desde(3),
            autor,
        },
        {
            id: 'a3',
            titulo: 'Jornada de vacunación',
            contenido: 'Vacunación gratuita contra la influenza en el vestíbulo principal, de 8:00 a 12:00.',
            es_publico: true,
            fecha_publicacion: desde(5),
            fecha_expiracion: desde(9),
            autor,
        },
        {
            id: 'a4',
            titulo: 'Mantenimiento de ascensores',
            contenido: 'Los ascensores del ala norte estarán fuera de servicio. Usa el ala sur.',
            es_publico: false,
            fecha_publicacion: desde(-15),
            fecha_expiracion: desde(-12),
            autor,
        },
    ];
}
reiniciar();

function vigencia(a: AvisoGuardado, ahora = Date.now()): VigenciaAviso {
    if (new Date(a.fecha_publicacion).getTime() > ahora) return 'programado';
    if (a.fecha_expiracion && new Date(a.fecha_expiracion).getTime() <= ahora) return 'vencido';
    return 'vigente';
}

const conVigencia = (a: AvisoGuardado): Aviso => ({ ...a, vigencia: vigencia(a) });

export function listar(f: FiltroAvisos, porPagina: number): PaginaAvisos {
    const items = avisos
        .map(conVigencia)
        .filter((a) => f.vigencia === 'todos' || a.vigencia === f.vigencia)
        .filter((a) => f.visibilidad === 'todos' || a.es_publico === (f.visibilidad === 'publicos'))
        // Igual que la API: de la publicación más reciente a la más antigua. Se comparan instantes, no
        // textos, porque las fechas llegan con distintos desfases (Z, -06:00).
        .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime());
    return {
        items: items.slice((f.page - 1) * porPagina, f.page * porPagina),
        paginacion: { pagina: f.page, por_pagina: porPagina, total: items.length, total_paginas: Math.ceil(items.length / porPagina) },
    };
}

export function crear(body: CrearAvisoBody): Aviso {
    const aviso = { ...body, id: `demo-${Date.now()}`, autor };
    avisos = [aviso, ...avisos];
    return conVigencia(aviso);
}

export function actualizar(id: string, body: ActualizarAvisoBody): Aviso {
    const actual = avisos.find((a) => a.id === id);
    if (!actual) throw new ApiError(404, 'NO_ENCONTRADO', 'El aviso no existe');
    const nuevo = { ...actual, ...body };
    avisos = avisos.map((a) => (a.id === id ? nuevo : a));
    return conVigencia(nuevo);
}

export function eliminar(id: string): { id: string } {
    if (!avisos.some((a) => a.id === id)) throw new ApiError(404, 'NO_ENCONTRADO', 'El aviso no existe');
    avisos = avisos.filter((a) => a.id !== id);
    return { id };
}
