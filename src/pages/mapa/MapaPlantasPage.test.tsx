import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { ApiError, apiFetch } from '@/lib/api';
import { listarPacientes } from '@/services/pacientes.service';
import type { Cama, Habitacion } from '@/types/habitaciones.types';

import MapaPlantasPage from './MapaPlantasPage';

const realtime = vi.hoisted(() => {
    const canal = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
    return { canal, channel: vi.fn(() => canal), removeChannel: vi.fn() };
});
vi.mock('@/lib/client', () => ({ isDemoMode: false, supabase: realtime }));
vi.mock('@/lib/api', async (importOriginal) => ({
    ...await importOriginal<typeof import('@/lib/api')>(), apiFetch: vi.fn(),
}));
vi.mock('@/services/pacientes.service', () => ({ listarPacientes: vi.fn(), PACIENTES_POR_PAGINA: 10 }));

const api = vi.mocked(apiFetch);
const paciente = { id: 'paciente-1', nombres: 'Ana', apellidos: 'Méndez', documento_identidad: '00000001-0', activo: true, hospitalizaciones: [] };
const ocupante = { hospitalizacion_id: 'ingreso-1', paciente };
const crearCama = (codigo: string): Cama => ({ id: codigo, codigo, estado: 'disponible', ocupante: null });

function abrirMapa() {
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(<QueryClientProvider client={cliente}><MapaPlantasPage /></QueryClientProvider>);
}

function mapaHospital(): Habitacion[] {
    return ([3, 2] as const).flatMap((planta) => Array.from({ length: planta === 3 ? 5 : 6 }, (_, i) => {
        const codigo = `${planta === 3 ? 'VIP' : 'HAB'}-${planta * 100 + i + 1}`;
        const camas = (planta === 3 ? ['A'] : ['A', 'B']).map((letra) => crearCama(`${codigo}-${letra}`));
        return { id: codigo, codigo, planta, activa: true, camas };
    }));
}

beforeEach(() => vi.clearAllMocks());

it('asigna, traslada, da de alta y deja la cama disponible después de la limpieza', async () => {
    const mapa = mapaHospital();
    const origen = mapa[0].camas[0];
    const destino = mapa[5].camas[0];
    const paginaMedicos = { items: [{ id: 'medico-1', nombres: 'Jorge', apellidos: 'Rivas', codigo_empleado: 'MED-1' }], paginacion: { total_paginas: 1 } };
    vi.mocked(listarPacientes).mockResolvedValue({ items: [paciente], total: 1 });
    api.mockImplementation(async (ruta) => {
        if (ruta === '/habitaciones') return structuredClone(mapa);
        if (ruta === '/tipos-personal') return [{ id: 'tipo-1', es_medico: true, activo: true }];
        if (ruta.startsWith('/personal?')) return paginaMedicos;
        if (ruta === '/hospitalizaciones') Object.assign(origen, { estado: 'ocupada', ocupante });
        if (ruta.endsWith('/traslado')) {
            Object.assign(origen, { estado: 'limpieza', ocupante: null });
            Object.assign(destino, { estado: 'ocupada', ocupante });
        }
        if (ruta.endsWith('/alta')) Object.assign(destino, { estado: 'limpieza', ocupante: null });
        if (ruta.endsWith('/estado')) destino.estado = 'disponible';
    });

    abrirMapa();
    fireEvent.click(await screen.findByRole('button', { name: /VIP-301-A Libre/ }));
    const ingreso = within(screen.getByRole('dialog', { name: 'Asignar cama' }));
    fireEvent.click(await ingreso.findByRole('button', { name: /Ana Méndez.*00000001-0/ }));
    const medico = await ingreso.findByRole('option', { name: /Jorge Rivas/ });
    fireEvent.change(ingreso.getByLabelText('Médico tratante'), { target: { value: medico.getAttribute('value') } });
    fireEvent.click(ingreso.getByRole('button', { name: 'Asignar cama' }));
    expect(await screen.findByText('Cama asignada.')).toBeInTheDocument();
    expect(screen.getByText('1/5 camas ocupadas')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/hospitalizaciones', {
        method: 'POST', body: JSON.stringify({ cama_id: origen.id, paciente_id: paciente.id, doctor_tratante_id: 'medico-1' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /VIP-301-A Ocupada Ana Méndez/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Trasladar paciente' }));
    const traslado = within(screen.getByRole('dialog', { name: 'Trasladar paciente' }));
    expect(traslado.queryByRole('option', { name: origen.codigo })).not.toBeInTheDocument();
    fireEvent.change(traslado.getByLabelText('Cama de destino'), { target: { value: destino.id } });
    fireEvent.click(traslado.getByRole('button', { name: 'Trasladar paciente' }));
    expect(await screen.findByRole('button', { name: /VIP-301-A En limpieza/ })).toBeInTheDocument();
    expect(screen.getByText('1/12 camas ocupadas')).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/hospitalizaciones/ingreso-1/traslado', {
        method: 'POST', body: JSON.stringify({ cama_id: destino.id }),
    });

    fireEvent.click(screen.getByRole('button', { name: /HAB-201-A Ocupada Ana Méndez/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar alta' }));
    const alta = within(screen.getByRole('dialog', { name: 'Registrar alta' }));
    fireEvent.click(alta.getByRole('button', { name: 'Registrar alta' }));
    const enLimpieza = await screen.findByRole('button', { name: /HAB-201-A En limpieza/ });
    expect(api).toHaveBeenCalledWith('/hospitalizaciones/ingreso-1/alta', { method: 'POST', body: '{}' });
    fireEvent.click(enLimpieza);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar cama como libre' }));
    expect(await screen.findByRole('button', { name: /HAB-201-A Libre/ })).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith('/camas/HAB-201-A/estado', { method: 'PATCH', body: '{"estado":"disponible"}' });
});

it('refresca el mapa con Realtime y bloquea un destino ocupado por otra sesión', async () => {
    const mapa = mapaHospital();
    const origen = mapa[0].camas[0];
    const destino = mapa[5].camas[0];
    Object.assign(origen, { estado: 'ocupada', ocupante });
    api.mockImplementation(async () => structuredClone(mapa));

    const vista = abrirMapa();
    await screen.findByText('1/5 camas ocupadas');
    expect(realtime.canal.on.mock.calls.map((call) => call[1].table)).toEqual(['camas', 'hospitalizaciones']);
    act(() => realtime.canal.subscribe.mock.calls[0][0]('SUBSCRIBED'));
    expect(await screen.findByText('En vivo')).toBeInTheDocument();
    const [cambioCama, cambioIngreso] = realtime.canal.on.mock.calls.map((call) => call[2]);
    fireEvent.click(screen.getByRole('button', { name: /VIP-301-A Ocupada/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Trasladar paciente' }));
    fireEvent.change(screen.getByLabelText('Cama de destino'), { target: { value: destino.id } });
    expect(screen.getByRole('button', { name: 'Trasladar paciente' })).toBeEnabled();

    destino.estado = 'ocupada';
    cambioCama();
    cambioIngreso();
    expect(await screen.findByRole('alert')).toHaveTextContent('La cama seleccionada ya no está libre.');
    expect(screen.getByRole('button', { name: 'Trasladar paciente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText('1/12 camas ocupadas')).toBeInTheDocument();

    vista.unmount();
    expect(realtime.removeChannel).toHaveBeenCalledWith(realtime.canal);
});

it('muestra un conflicto devuelto por la API y vuelve a leer el mapa', async () => {
    const mapa = mapaHospital();
    const origen = mapa[0].camas[0];
    const destino = mapa[5].camas[0];
    Object.assign(origen, { estado: 'ocupada', ocupante });
    api.mockImplementation(async (ruta) => {
        if (ruta === '/habitaciones') return structuredClone(mapa);
        destino.estado = 'mantenimiento';
        throw new ApiError(409, 'CAMA_NO_DISPONIBLE', 'La cama de destino está en mantenimiento.');
    });

    abrirMapa();
    fireEvent.click(await screen.findByRole('button', { name: /VIP-301-A Ocupada/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Trasladar paciente' }));
    fireEvent.change(screen.getByLabelText('Cama de destino'), { target: { value: destino.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Trasladar paciente' }));
    expect(await screen.findByText('La cama de destino está en mantenimiento.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Trasladar paciente' })).toBeDisabled());
    expect(screen.queryByRole('option', { name: destino.codigo })).not.toBeInTheDocument();
});
