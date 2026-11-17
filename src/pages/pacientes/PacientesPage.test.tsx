import { fireEvent, render, screen, within } from '@testing-library/react';
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
        const alfabeto = within(screen.getByRole('group', { name: 'Inicial del apellido' }));
        fireEvent.click(alfabeto.getByRole('button', { name: 'M' }));
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
        expect(screen.getByRole('button', { name: 'M', pressed: true })).toBeInTheDocument();
    });

    it('filtra por inicial sobre todo el listado y vuelve a la primera página al cambiar de letra', async () => {
        abrir('/pacientes', 'administrador@hospital.test');
        const alfabeto = within(await screen.findByRole('group', { name: 'Inicial del apellido' }));
        expect(alfabeto.getByRole('button', { name: 'Ñ' })).toBeInTheDocument();
        expect(alfabeto.getByRole('button', { name: 'Todos', pressed: true })).toBeInTheDocument();
        const tabla = within(screen.getByRole('table', { name: 'Pacientes' }));
        const paginacion = within(await screen.findByRole('navigation', { name: 'Paginación' }));
        const primeraPagina = tabla.getAllByRole('link').map((enlace) => enlace.getAttribute('href'));
        expect(tabla.getByRole('columnheader', { name: 'Apellidos y nombres' })).toBeInTheDocument();
        const nombres = tabla.getAllByRole('row').slice(1).map((fila) => within(fila).getAllByRole('cell')[0].textContent ?? '');
        const apellidos = nombres.map((nombre) => nombre.split(',')[0]);
        expect(nombres.every((nombre) => nombre.includes(', '))).toBe(true);
        expect(apellidos).toEqual([...apellidos].sort((a, b) => a.localeCompare(b, 'es-SV')));
        fireEvent.click(alfabeto.getByRole('button', { name: 'Todos', pressed: true }));
        expect(tabla.getAllByRole('link').map((enlace) => enlace.getAttribute('href'))).toEqual(primeraPagina);
        fireEvent.click(paginacion.getByRole('button', { name: '2' }));
        expect(await screen.findByRole('button', { name: '2', current: 'page' })).toBeInTheDocument();

        fireEvent.click(alfabeto.getByRole('button', { name: 'M' }));
        expect(await screen.findByRole('link', { name: 'Ver ficha de Luis Martínez' })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Ver ficha de María López' })).toBeNull();
        expect(within(await screen.findByRole('navigation', { name: 'Paginación' }))
            .getByRole('button', { name: '1', current: 'page' })).toBeInTheDocument();

        fireEvent.click(alfabeto.getByRole('button', { name: 'Todos' }));
        expect(alfabeto.getByRole('button', { name: 'Todos', pressed: true })).toBeInTheDocument();
        expect((await tabla.findAllByRole('link')).map((enlace) => enlace.getAttribute('href'))).toEqual(primeraPagina);
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
