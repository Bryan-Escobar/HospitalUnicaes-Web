import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/client', () => ({ isDemoMode: true }));

import App from '@/App';

function abrir(ruta: string, correo?: string) {
    if (correo) sessionStorage.setItem('hu-demo-session', correo);
    render(<MemoryRouter initialEntries={[ruta]}><App /></MemoryRouter>);
}

describe('Pacientes', () => {
    afterEach(() => sessionStorage.clear());

    it('combina búsqueda y filtros, abre la ficha y conserva el listado al volver', async () => {
        abrir('/pacientes', 'administrador@hospital.test');
        const buscar = await screen.findByRole('searchbox', { name: 'Buscar por nombre o documento' });
        fireEvent.change(buscar, { target: { value: '01234567-8' } });
        fireEvent.change(screen.getByRole('combobox', { name: 'Hospitalización' }), { target: { value: 'hospitalizados' } });
        const estado = screen.getByRole('combobox', { name: 'Estado del paciente' });
        fireEvent.change(estado, { target: { value: 'inactivos' } });
        expect(await screen.findByText('Sin coincidencias')).toBeInTheDocument();

        fireEvent.change(estado, { target: { value: 'activos' } });
        const ficha = await screen.findByRole('link', { name: 'Ver ficha de Luis Martínez' });
        expect(screen.queryByText('01234567-8')).not.toBeInTheDocument();
        fireEvent.click(ficha);

        expect(await screen.findByRole('heading', { name: 'Luis Martínez' })).toBeInTheDocument();
        expect(screen.getByText('01234567-8')).toBeInTheDocument();
        expect(screen.getByText('HAB-204-A')).toBeInTheDocument();
        expect(await screen.findByText('Confirmada')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('link', { name: 'Volver a pacientes' }));
        expect(await screen.findByRole('link', { name: 'Ver ficha de Luis Martínez' })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Estado del paciente' })).toHaveValue('activos');
        expect(screen.getByRole('combobox', { name: 'Hospitalización' })).toHaveValue('hospitalizados');
    });

    it.each([
        ['recepcionista@hospital.test', 'Acceso denegado'],
        ['inactivo@hospital.test', 'Cuenta desactivada'],
    ])('bloquea el acceso directo a la ficha para %s', async (correo, titulo) => {
        abrir('/pacientes/p1', correo);
        expect(await screen.findByRole('heading', { name: titulo })).toBeInTheDocument();
        expect(screen.queryByText('01234567-8')).not.toBeInTheDocument();
    });
});
