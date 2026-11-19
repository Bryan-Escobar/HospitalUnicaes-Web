import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/client', () => ({ isDemoMode: false }));
vi.mock('@/lib/api', async (original) => ({ ...(await original<typeof import('@/lib/api')>()), apiFetch: vi.fn() }));

import { apiFetch } from '@/lib/api';
import { actualizarAviso, crearAviso, eliminarAviso, listarAvisos } from './avisos.service';

const fetchApi = vi.mocked(apiFetch);

beforeEach(() => fetchApi.mockReset().mockResolvedValue({}));

describe('avisos.service contra /api/avisos', () => {
    it.each([
        [{ vigencia: 'todos', visibilidad: 'todos', page: 1 }, '/avisos?vigencia=todos&pagina=1&por_pagina=10'],
        [{ vigencia: 'vigente', visibilidad: 'publicos', page: 2 }, '/avisos?vigencia=vigentes&pagina=2&por_pagina=10&es_publico=true'],
        [{ vigencia: 'programado', visibilidad: 'internos', page: 1 }, '/avisos?vigencia=programados&pagina=1&por_pagina=10&es_publico=false'],
        [{ vigencia: 'vencido', visibilidad: 'todos', page: 1 }, '/avisos?vigencia=vencidos&pagina=1&por_pagina=10'],
    ] as const)('lista con %o', async (filtro, ruta) => {
        await listarAvisos(filtro);
        expect(fetchApi).toHaveBeenCalledWith(ruta);
    });

    it('crea, edita y elimina con el método y el cuerpo de la API', async () => {
        const body = {
            titulo: 'Horario de visitas',
            contenido: 'De 2:00 a 6:00 p. m.',
            es_publico: true,
            fecha_publicacion: '2026-11-14T08:00:00-06:00',
            fecha_expiracion: null,
        };
        await crearAviso(body);
        expect(fetchApi).toHaveBeenLastCalledWith('/avisos', { method: 'POST', body: JSON.stringify(body) });

        await actualizarAviso('a1', { titulo: 'Nuevo título' });
        expect(fetchApi).toHaveBeenLastCalledWith('/avisos/a1', { method: 'PATCH', body: '{"titulo":"Nuevo título"}' });

        await eliminarAviso('a1');
        expect(fetchApi).toHaveBeenLastCalledWith('/avisos/a1', { method: 'DELETE' });
    });
});
