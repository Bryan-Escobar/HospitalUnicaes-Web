import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/client', () => ({ isDemoMode: true }));

import App from '@/App';
import { fechaHospital, sumarDias } from '@/lib/fechas-hospital';

function abrirLaboratorio(correo: string) {
    sessionStorage.setItem('hu-demo-session', correo);
    render(<MemoryRouter initialEntries={['/laboratorio']}><App /></MemoryRouter>);
}

describe('Laboratorio', () => {
    afterEach(() => sessionStorage.clear());

    it('combina los filtros, cuenta todo el rango y abre el historial de la orden', async () => {
        abrirLaboratorio('administrador@hospital.test');

        const estados = within(await screen.findByRole('group', { name: 'Filtrar por estado' }));
        const tabla = within(screen.getByRole('table', { name: 'Órdenes de laboratorio' }));
        expect(await estados.findByRole('button', { name: 'Todas 27' })).toBeInTheDocument();
        expect(await tabla.findByRole('button', { name: 'Ver detalle de la orden #1042' })).toBeInTheDocument();
        expect(tabla.getAllByRole('row')).toHaveLength(11);

        const doctor = screen.getByRole('combobox', { name: 'Doctor' });
        await within(doctor).findByRole('option', { name: 'Sofía Rivas' });
        fireEvent.change(doctor, { target: { value: 'rivas' } });
        const hoy = fechaHospital();
        fireEvent.change(screen.getByLabelText('Desde'), { target: { value: hoy } });
        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: hoy } });
        expect(await estados.findByRole('button', { name: 'Todas 1' })).toBeInTheDocument();
        expect(estados.getByRole('button', { name: 'Pendiente 0' })).toBeInTheDocument();
        expect(estados.getByRole('button', { name: 'En Proceso 0' })).toBeInTheDocument();

        fireEvent.click(estados.getByRole('button', { name: 'Pendiente 0' }));
        expect(await tabla.findByText('No hay órdenes con esos filtros')).toBeInTheDocument();
        fireEvent.click(estados.getByRole('button', { name: 'Completado 1' }));
        fireEvent.click(await tabla.findByRole('button', { name: 'Ver detalle de la orden #1040' }));

        const dialogo = within(screen.getByRole('dialog', { name: 'Orden #1040' }));
        const historial = within(await dialogo.findByRole('region', { name: 'Historial de estados' }));
        expect(historial.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
            expect.stringMatching(/^Pendiente.+/),
            expect.stringMatching(/^En Proceso.+/),
            expect.stringMatching(/^Completado.+/),
        ]);
        expect(dialogo.getByText('Química sanguínea')).toBeInTheDocument();
        fireEvent.click(dialogo.getByRole('button', { name: 'Cerrar' }));

        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: sumarDias(hoy, -1) } });
        expect(screen.getByRole('alert')).toHaveTextContent('La fecha Hasta debe ser igual o posterior');
        expect(screen.queryByRole('table', { name: 'Órdenes de laboratorio' })).toBeNull();
    });

    it('restringe la ruta a administración', async () => {
        abrirLaboratorio('recepcionista@hospital.test');
        expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
        expect(screen.queryByRole('table', { name: 'Órdenes de laboratorio' })).toBeNull();
    });
});
