import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import App from '@/App';
import { queryClient } from '@/lib/query-client';

const auth = vi.hoisted(() => ({
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
    reauthenticate: vi.fn(),
}));

vi.mock('@/lib/client', () => ({ isDemoMode: false, supabase: { auth } }));

const session = { access_token: 'token-de-prueba', user: { id: 'perfil-test', email: 'ana@hospital.test' } };
const perfil = {
    id: session.user.id,
    email: session.user.email,
    nombres: 'Ana',
    apellidos: 'López',
    telefono: '+503 7000-0001',
    avatar_url: null,
    activo: true,
    rol: 'administrador',
    personal: null,
    paciente_id: null,
};

function abrirPerfil() {
    render(<MemoryRouter initialEntries={['/perfil']}><App /></MemoryRouter>);
    return screen.findByRole('heading', { name: 'Perfil y configuración' });
}

beforeEach(() => {
    auth.getSession.mockResolvedValue({ data: { session } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: perfil })));
});

afterEach(() => {
    localStorage.removeItem(`hu-alertas-panel:${session.user.id}`);
    queryClient.clear();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
});

it('guarda los datos de la cuenta y actualiza el nombre mostrado en el panel', async () => {
    await abrirPerfil();
    expect(screen.getByLabelText('Correo de la cuenta')).toHaveValue(perfil.email);
    expect(screen.getByLabelText('Correo de la cuenta')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Teléfono')).toHaveValue(perfil.telefono);
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({
        data: { ...perfil, nombres: 'Ana María', telefono: null },
    }));

    fireEvent.change(screen.getByLabelText('Nombres'), { target: { value: ' Ana María ' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Cambios guardados')).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(expect.stringMatching(/\/auth\/me$/), expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ nombres: 'Ana María', telefono: null }),
    }));
    expect(screen.getByRole('link', { name: /Ana María López/ })).toHaveAttribute('href', '/perfil');
});

it('usa los alcances correctos y limpia la caché al cerrar la sesión actual', async () => {
    auth.signOut.mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: new Error('Sin conexión') })
        .mockResolvedValueOnce({ error: null });
    queryClient.setQueryData(['datos-privados'], { prueba: true });
    await abrirPerfil();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar otras sesiones' }));
    expect(await screen.findByText('Se cerraron las otras sesiones.')).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenNthCalledWith(1, { scope: 'others' });
    expect(queryClient.getQueryData(['datos-privados'])).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByText('No se pudo cerrar la sesión. Intenta de nuevo.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(auth.signOut).toHaveBeenNthCalledWith(3, { scope: 'local' });
    expect(queryClient.getQueryData(['datos-privados'])).toBeUndefined();
    expect(screen.queryByText('Tu sesión terminó')).not.toBeInTheDocument();
});

it('pide y envía el código de verificación si Supabase solicita reautenticación', async () => {
    auth.updateUser.mockResolvedValueOnce({ error: { code: 'reauthentication_needed' } })
        .mockResolvedValueOnce({ error: null });
    auth.reauthenticate.mockResolvedValue({ error: null });
    await abrirPerfil();

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Ejemplo123' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Ejemplo123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    fireEvent.change(await screen.findByLabelText('Código enviado a tu correo'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument();
    expect(auth.reauthenticate).toHaveBeenCalledOnce();
    expect(auth.updateUser).toHaveBeenLastCalledWith({ password: 'Ejemplo123', nonce: '123456' });
});
