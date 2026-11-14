import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/client', () => ({ isDemoMode: true }));

import App from '@/App';
import { fechaHoraHospital } from '@/lib/fechas-hospital';
import { reiniciar } from '@/services/avisos.mock';

const DIA = 24 * 60 * 60 * 1000;

async function abrirAvisos(correo = 'administrador@hospital.test') {
    sessionStorage.setItem('hu-demo-session', correo);
    render(
        <MemoryRouter initialEntries={['/avisos']}>
            <App />
        </MemoryRouter>,
    );
    if (correo.startsWith('administrador')) await screen.findByRole('table', { name: 'Avisos' });
}

const tabla = () => within(screen.getByRole('table', { name: 'Avisos' }));
const titulos = () =>
    tabla()
        .getAllByRole('row')
        .slice(1)
        .map((fila) => within(fila).getAllByRole('cell')[0].querySelector('.font-semibold')?.textContent);

beforeEach(() => {
    reiniciar();
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    );
});

afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
});

describe('Avisos', () => {
    it('lista los avisos y combina los filtros de vigencia y visibilidad', async () => {
        await abrirAvisos();
        await tabla().findByText('Horario de visitas');
        expect(titulos()).toHaveLength(4);

        const vigencia = within(screen.getByRole('group', { name: 'Filtrar por vigencia' }));
        const visibilidad = within(screen.getByRole('group', { name: 'Filtrar por visibilidad' }));

        fireEvent.click(vigencia.getByRole('button', { name: 'Vigentes' }));
        await waitFor(() => expect(titulos()).toEqual(['Reunión clínica mensual', 'Horario de visitas']));

        fireEvent.click(visibilidad.getByRole('button', { name: 'Públicos' }));
        await waitFor(() => expect(titulos()).toEqual(['Horario de visitas']));

        fireEvent.click(vigencia.getByRole('button', { name: 'Vencidos' }));
        expect(await tabla().findByText('No hay avisos con estos filtros')).toBeInTheDocument();
    });

    it('publica un aviso solo después de la vista previa', async () => {
        await abrirAvisos();
        await tabla().findByText('Horario de visitas');
        fireEvent.click(screen.getAllByRole('button', { name: /Nuevo aviso/ })[0]);

        const dialogo = within(screen.getByRole('dialog', { name: 'Nuevo aviso' }));
        // Sin título ni contenido no se llega a la vista previa.
        fireEvent.click(dialogo.getByRole('button', { name: 'Vista previa' }));
        expect(await dialogo.findByText('Escribe un título.')).toBeInTheDocument();
        expect(dialogo.getByText('Escribe el contenido del aviso.')).toBeInTheDocument();
        expect(dialogo.queryByRole('button', { name: 'Publicar aviso' })).toBeNull();

        fireEvent.change(dialogo.getByLabelText('Título'), { target: { value: 'Donación de sangre' } });
        fireEvent.change(dialogo.getByLabelText('Contenido'), { target: { value: 'Sábado de 8:00 a 12:00 en el vestíbulo.' } });
        // La expiración no puede ser anterior a la publicación.
        const desde = dialogo.getByLabelText('Visible desde') as HTMLInputElement;
        fireEvent.change(dialogo.getByLabelText('Hasta (opcional)'), {
            target: { value: fechaHoraHospital(new Date(Date.now() - DIA)) },
        });
        fireEvent.click(dialogo.getByRole('button', { name: 'Vista previa' }));
        expect(await dialogo.findByText('Debe ser posterior a la fecha de publicación.')).toBeInTheDocument();
        expect(desde.value).toBe(fechaHoraHospital().slice(0, 16));

        fireEvent.change(dialogo.getByLabelText('Hasta (opcional)'), { target: { value: '' } });
        fireEvent.click(dialogo.getByRole('button', { name: 'Vista previa' }));

        const previa = within(await screen.findByRole('dialog', { name: 'Vista previa' }));
        const tarjeta = within(previa.getByRole('region', { name: 'Vista previa del aviso' }));
        expect(tarjeta.getByRole('heading', { name: 'Donación de sangre' })).toBeInTheDocument();
        expect(tarjeta.getByText('Lo verá cualquiera, incluso sin iniciar sesión.')).toBeInTheDocument();
        expect(tarjeta.getByText(/no tiene fecha de expiración/)).toBeInTheDocument();

        // Volver a editar conserva lo escrito.
        fireEvent.click(previa.getByRole('button', { name: 'Volver a editar' }));
        expect(within(screen.getByRole('dialog', { name: 'Nuevo aviso' })).getByLabelText('Título')).toHaveValue('Donación de sangre');
        fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Publicar aviso' }));

        expect(await screen.findByText(/Se publicó «Donación de sangre»\. Ya se muestra en la información pública\./)).toBeInTheDocument();
        // La API ordena por fecha de publicación, de la más reciente a la más antigua.
        await waitFor(() => expect(titulos()).toEqual(['Jornada de vacunación', 'Donación de sangre', 'Reunión clínica mensual', 'Mantenimiento de ascensores', 'Horario de visitas']));
    });

    it('edita un aviso enviando solo lo que cambió y lo deja programado', async () => {
        await abrirAvisos();
        fireEvent.click(await tabla().findByRole('button', { name: 'Editar «Horario de visitas»' }));

        const dialogo = within(screen.getByRole('dialog', { name: 'Editar aviso' }));
        expect(dialogo.getByLabelText('Título')).toHaveValue('Horario de visitas');
        // Sin cambios no hay nada que previsualizar.
        expect(dialogo.getByRole('button', { name: 'Vista previa' })).toBeDisabled();

        fireEvent.change(dialogo.getByLabelText('Visible desde'), {
            target: { value: fechaHoraHospital(new Date(Date.now() + 2 * DIA)) },
        });
        fireEvent.click(dialogo.getByRole('radio', { name: 'Interno' }));
        fireEvent.click(dialogo.getByRole('button', { name: 'Vista previa' }));

        const previa = within(await screen.findByRole('dialog', { name: 'Vista previa' }));
        expect(previa.getByText('Solo lo verá el personal con sesión iniciada.')).toBeInTheDocument();
        expect(previa.getByText(/Se mostrará a partir del/)).toBeInTheDocument();
        fireEvent.click(previa.getByRole('button', { name: 'Guardar cambios' }));

        expect(await screen.findByText('Se guardó «Horario de visitas». Quedó programado.')).toBeInTheDocument();
        const fila = (await tabla().findByText('Horario de visitas')).closest('tr')!;
        expect(within(fila).getByText('Interno')).toBeInTheDocument();
        expect(within(fila).getByText('Programado')).toBeInTheDocument();
    });

    it('elimina un aviso después de confirmar', async () => {
        await abrirAvisos();
        fireEvent.click(await tabla().findByRole('button', { name: 'Eliminar «Horario de visitas»' }));

        const dialogo = within(screen.getByRole('dialog', { name: 'Eliminar aviso' }));
        expect(dialogo.getByText(/deja de mostrarse en la información pública/)).toBeInTheDocument();
        fireEvent.click(dialogo.getByRole('button', { name: 'Eliminar' }));

        expect(await screen.findByText('Se eliminó «Horario de visitas».')).toBeInTheDocument();
        await waitFor(() => expect(titulos()).toHaveLength(3));
        expect(tabla().queryByText('Horario de visitas')).toBeNull();
    });

    it('restringe la ruta a administración', async () => {
        await abrirAvisos('recepcionista@hospital.test');
        expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
        expect(screen.queryByRole('table', { name: 'Avisos' })).toBeNull();
    });
});
