import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ResumenDashboard } from '@/types/dashboard.types';

const servicio = vi.hoisted(() => ({ obtenerResumenDashboard: vi.fn() }));
vi.mock('@/services/dashboard.service', () => servicio);

import Dashboard from '@/pages/dashboard/dashboard';

const resumen: ResumenDashboard = {
    ocupacion: {
        vip: { ocupadas: 2, disponibles: 3, total: 5 },
        semiprivada: { ocupadas: 7, disponibles: 5, total: 12 },
        total: { ocupadas: 9, disponibles: 8, total: 17 },
    },
    personal_de_turno: { total: 5, por_tipo: [{ tipo: 'Doctor', cantidad: 3 }, { tipo: 'Enfermero/a', cantidad: 2 }] },
    ambulancia: { estado: 'en_mantenimiento', solicitud_activa_id: null },
    citas_hoy: { total: 6, por_estado: [{ estado: 'atendida', cantidad: 4 }, { estado: 'programada', cantidad: 2 }] },
    laboratorio: { pendientes: 1, en_proceso: 0 },
    inventario_bajo_minimo: 3,
    lotes_por_vencer: { vencidos: 1, en_15_dias: 2, en_30_dias: 0 },
    generado_en: '2026-10-29T15:00:00.000Z',
};

function renderDashboard() {
    render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>,
    );
}

describe('Dashboard', () => {
    afterEach(() => vi.resetAllMocks());

    it('muestra el resumen de la API separando VIP y semiprivadas', async () => {
        servicio.obtenerResumenDashboard.mockResolvedValue(resumen);
        renderDashboard();

        expect(await screen.findByText('VIP-301 a VIP-305 · 3 libres')).toBeInTheDocument();
        expect(screen.getByText('HAB-201 a HAB-206 · 5 libres')).toBeInTheDocument();
        expect(screen.getByText('53 % · 8 camas libres')).toBeInTheDocument();
        expect(screen.getByText('En Mantenimiento')).toBeInTheDocument();
        expect(screen.getByText('4 atendidas · 2 por atender')).toBeInTheDocument();
        expect(screen.getByText('Enfermero/a')).toBeInTheDocument();
    });

    it('enlaza las alertas de inventario con el inventario', async () => {
        servicio.obtenerResumenDashboard.mockResolvedValue(resumen);
        renderDashboard();

        const bajoMinimo = await screen.findByRole('link', { name: /Ítems bajo el stock mínimo/ });
        expect(bajoMinimo).toHaveAttribute('href', '/inventario?stock=bajo');
        expect(within(bajoMinimo).getByText('3')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Lotes vencidos/ })).toHaveAttribute('href', '/inventario');
        expect(screen.getByRole('link', { name: /Vencen en 15 días/ })).toHaveTextContent('2');
        expect(screen.getByRole('link', { name: /Vencen en 16 a 30 días/ })).toHaveTextContent('0');
    });

    it('avisa cuando la API falla', async () => {
        servicio.obtenerResumenDashboard.mockRejectedValue(new Error('caída'));
        renderDashboard();

        expect(await screen.findByText('No se pudo cargar el resumen del hospital')).toBeInTheDocument();
    });
});
