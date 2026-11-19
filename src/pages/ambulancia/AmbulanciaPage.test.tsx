import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from '@/lib/api';
import BitacoraPage from '@/pages/bitacora/BitacoraPage';
import type { Ambulancia, EntradaBitacora } from '@/types/ambulancia.types';
import AmbulanciaPage from './AmbulanciaPage';

vi.mock('@/lib/client', () => ({ isDemoMode: false }));
vi.mock('@/lib/api', async (importOriginal) => ({
    ...await importOriginal<typeof import('@/lib/api')>(),
    apiFetch: vi.fn(),
}));

const peticion = vi.mocked(apiFetch);
const fecha = '2026-11-17T14:30:00Z';

afterEach(() => {
    cleanup();
    peticion.mockReset();
});

it('persiste ambos cambios de mantenimiento y actualiza el panel cuando se despacha la unidad', async () => {
    let estado: Ambulancia['estado'] = 'disponible';
    peticion.mockImplementation(async (path, init) => {
        if (path.startsWith('/ambulancia/solicitudes?')) return { items: [], paginacion: { total: 0 } };
        if (path === '/ambulancia/estado') {
            const cambio = JSON.parse(String(init?.body));
            if (estado === 'en_servicio') throw new ApiError(422, 'AMBULANCIA_EN_SERVICIO', 'Hay un servicio en curso');
            estado = cambio.estado;
        }
        return {
            id: 'unidad', placa: 'AMB-001', estado, updated_at: fecha, ubicacion_actual: null, solicitud_activa: null,
        };
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<MemoryRouter><QueryClientProvider client={queryClient}><AmbulanciaPage /></QueryClientProvider></MemoryRouter>);

    const poner = screen.getByRole('button', { name: 'Poner en mantenimiento' });
    const quitar = screen.getByRole('button', { name: 'Quitar mantenimiento' });
    await waitFor(() => expect(poner).toBeEnabled());
    fireEvent.click(poner);
    await waitFor(() => expect(quitar).toBeEnabled());
    expect(peticion).toHaveBeenCalledWith('/ambulancia/estado', {
        method: 'PATCH', body: '{"estado":"en_mantenimiento"}',
    });
    fireEvent.click(quitar);
    await waitFor(() => expect(poner).toBeEnabled());
    expect(peticion).toHaveBeenCalledWith('/ambulancia/estado', {
        method: 'PATCH', body: '{"estado":"disponible"}',
    });

    estado = 'en_servicio';
    fireEvent.click(poner);
    expect(await screen.findByRole('alert')).toHaveTextContent('Hay un servicio en curso');
    await screen.findByText('En Servicio');
    expect(poner).toBeDisabled();
    expect(quitar).toBeDisabled();

    estado = 'disponible';
    await waitFor(() => expect(poner).toBeEnabled(), { timeout: 7_000 });
}, 10_000);

it('envía los filtros combinados, vuelve a la primera página y permite consultar el detalle', async () => {
    const registro: EntradaBitacora = {
        id: 'registro', estado_anterior: 'en_servicio', estado_nuevo: 'disponible',
        descripcion: 'Traslado completado', registrado_por: null, created_at: fecha,
        solicitud: {
            id: 'solicitud', estado: 'finalizada', tipo_emergencia: 'accidente', paciente: null,
            canal: 'app', prioridad: 'urgente', direccion_origen: 'Santa Ana', destino: 'Hospital UNICAES',
            latitud: null, longitud: null, descripcion_emergencia: 'Accidente de tránsito',
            fecha_solicitud: fecha, fecha_despacho: fecha, fecha_cierre: fecha,
        },
    };
    peticion.mockResolvedValue({ items: [registro], paginacion: { total: 11 } });
    render(<MemoryRouter><BitacoraPage /></MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: /Siguiente/ }));
    expect(peticion).toHaveBeenLastCalledWith('/ambulancia/bitacora?pagina=2&por_pagina=10', expect.anything());

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-17' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-17' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Estado' }), { target: { value: 'disponible' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de emergencia' }), { target: { value: 'accidente' } });
    expect(peticion).toHaveBeenLastCalledWith(
        '/ambulancia/bitacora?pagina=1&por_pagina=10&desde=2026-11-17&hasta=2026-11-17&estado=disponible&tipo_emergencia=accidente',
        expect.anything(),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Ver detalle' }));
    const detalle = within(screen.getByRole('dialog', { name: 'Detalle del registro' }));
    expect(detalle.getByText('Accidente de tránsito')).toBeInTheDocument();
    expect(detalle.getByText('Traslado completado')).toBeInTheDocument();
    fireEvent.click(detalle.getByRole('button', { name: 'Cerrar' }));

    const consultas = peticion.mock.calls.length;
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-16' } });
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha inicial debe ser anterior o igual a la fecha final');
    expect(peticion).toHaveBeenCalledTimes(consultas);
});
