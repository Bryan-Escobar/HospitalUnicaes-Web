import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import type { Reportes } from '@/services/reportes.service';
import ReportesPage from './ReportesPage';

const { obtenerReportes, exportarReportes } = vi.hoisted(() => ({ obtenerReportes: vi.fn(), exportarReportes: vi.fn() }));
vi.mock('@/services/reportes.service', () => ({ obtenerReportes }));
vi.mock('./exportar-reportes', () => ({ exportarReportes }));

afterEach(() => vi.resetAllMocks());

it('aplica el rango y exporta la ocupación de la planta visible junto con las demás métricas', async () => {
    const datos: Reportes = {
        ocupacion: [
            { planta: 2, fecha: '2026-01-12', ocupadas: 1 },
            { planta: 3, fecha: '2026-01-12', ocupadas: 2 },
        ],
        citas: [{ doctor_id: 'doctor', doctor: 'Marta Ruiz', atendidas: 4 }],
        ambulancia: [{ semana: '2026-01-12', servicios: 2 }],
        laboratorio: { pendiente: 0, en_proceso: 0, completado: 0 },
    };
    obtenerReportes.mockResolvedValue(datos);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><ReportesPage /></QueryClientProvider>);
    await screen.findByText('Marta Ruiz');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-12' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-01-12' } });
    const exportar = screen.getByRole('button', { name: 'Exportar CSV' });
    expect(exportar).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar fechas' }));

    const rango = { desde: '2026-01-12', hasta: '2026-01-12' };
    await waitFor(() => expect(obtenerReportes).toHaveBeenLastCalledWith(rango, expect.any(AbortSignal)));
    fireEvent.change(await screen.findByLabelText('Planta'), { target: { value: '3' } });
    expect(screen.queryByRole('heading', { name: 'Planta 2' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Planta 3' })).toBeInTheDocument();

    fireEvent.click(exportar);
    expect(exportarReportes).toHaveBeenCalledWith(rango, { ...datos, ocupacion: [datos.ocupacion[1]] });
});
