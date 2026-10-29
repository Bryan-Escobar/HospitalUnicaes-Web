import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
    getSession: vi.fn(),
    refreshSession: vi.fn(),
    signOut: vi.fn(),
}));
vi.mock('@/lib/client', () => ({ supabase: { auth } }));

import { ApiError, apiFetch } from '@/lib/api';

function respuesta(status: number, body: unknown) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('apiFetch', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
        auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token-1' } } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetAllMocks();
    });

    it('envía el JWT de la sesión y devuelve `data`', async () => {
        fetchMock.mockResolvedValue(respuesta(200, { success: true, data: { id: 7 } }));

        await expect(apiFetch('/pacientes/7')).resolves.toEqual({ id: 7 });

        const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
        expect(headers.get('Authorization')).toBe('Bearer token-1');
    });

    it('renueva la sesión y reintenta una vez ante un 401', async () => {
        auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'token-2' } }, error: null });
        fetchMock
            .mockResolvedValueOnce(respuesta(401, { code: 'NO_AUTENTICADO' }))
            .mockResolvedValueOnce(respuesta(200, { data: 'ok' }));

        await expect(apiFetch('/perfil')).resolves.toBe('ok');

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const headers = new Headers(fetchMock.mock.calls[1][1]?.headers);
        expect(headers.get('Authorization')).toBe('Bearer token-2');
    });

    it('cierra la sesión local si la renovación falla', async () => {
        auth.refreshSession.mockResolvedValue({ data: { session: null }, error: new Error('expirado') });
        fetchMock.mockResolvedValue(respuesta(401, {}));

        await expect(apiFetch('/perfil')).rejects.toMatchObject({ status: 401, code: 'NO_AUTENTICADO' });
        expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('convierte las respuestas de error en ApiError', async () => {
        fetchMock.mockResolvedValue(
            respuesta(400, { code: 'VALIDACION', message: 'Datos inválidos', errors: [{ field: 'email', message: 'Requerido' }] }),
        );

        const error = await apiFetch('/usuarios', { method: 'POST', body: '{}' }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 400, code: 'VALIDACION', errors: [{ field: 'email', message: 'Requerido' }] });
    });
});
