import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const entorno = vi.hoisted(() => ({ demo: true, apiFetch: vi.fn() }));
vi.mock('@/lib/client', () => ({ get isDemoMode() { return entorno.demo; } }));
vi.mock('@/lib/api', async (importOriginal) => ({
    ...await importOriginal<typeof import('@/lib/api')>(),
    apiFetch: entorno.apiFetch,
}));

import App from '@/App';
import { fechaHospital, sumarDias } from '@/lib/fechas-hospital';
import { OrdenLaboratorioDialog } from './OrdenLaboratorioDialog';

function abrirLaboratorio(correo: string) {
    sessionStorage.setItem('hu-demo-session', correo);
    render(<MemoryRouter initialEntries={['/laboratorio']}><App /></MemoryRouter>);
}

describe('Laboratorio', () => {
    afterEach(() => {
        sessionStorage.clear();
        entorno.demo = true;
        entorno.apiFetch.mockReset();
        vi.restoreAllMocks();
    });

    it('combina los filtros, cuenta todo el rango y abre el historial de la orden', async () => {
        abrirLaboratorio('administrador@hospital.test');

        const estados = within(await screen.findByRole('group', { name: 'Filtrar por estado' }));
        const tabla = within(screen.getByRole('table', { name: 'Órdenes de laboratorio' }));
        const hoy = fechaHospital();
        expect(screen.getByLabelText('Desde')).toHaveValue(hoy);
        expect(screen.getByLabelText('Hasta')).toHaveValue(hoy);
        expect(await estados.findByRole('button', { name: 'Todas 3' })).toBeInTheDocument();
        expect(await tabla.findByRole('button', { name: 'Ver detalle de la orden #1042' })).toBeInTheDocument();
        expect(tabla.getAllByRole('row')).toHaveLength(4);

        fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
        expect(await estados.findByRole('button', { name: 'Todas 27' })).toBeInTheDocument();
        const laboratorio = within(screen.getByRole('main'));
        const buscador = laboratorio.getByRole('searchbox', { name: 'Buscar por paciente o examen' });
        expect(laboratorio.getAllByRole('searchbox')).toHaveLength(1);
        fireEvent.change(buscador, { target: { value: 'cruz elena' } });
        expect(await estados.findByRole('button', { name: 'Todas 9' })).toBeInTheDocument();
        expect(await tabla.findAllByText('Elena Cruz')).toHaveLength(9);
        expect(tabla.queryByText('María López')).toBeNull();
        fireEvent.change(buscador, { target: { value: 'Examen inexistente' } });
        expect(await tabla.findByText('No hay órdenes con esos filtros')).toBeInTheDocument();
        fireEvent.change(buscador, { target: { value: 'Hemograma' } });
        expect(await estados.findByRole('button', { name: 'Todas 9' })).toBeInTheDocument();
        expect(await tabla.findAllByText('María López')).toHaveLength(9);
        expect(tabla.queryByText('Elena Cruz')).toBeNull();
        fireEvent.change(buscador, { target: { value: 'química sanguínea' } });
        fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));

        const doctor = screen.getByRole('combobox', { name: 'Doctor' });
        await within(doctor).findByRole('option', { name: 'Sofía Rivas' });
        fireEvent.change(doctor, { target: { value: 'rivas' } });
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
        expect(dialogo.queryByRole('button', { name: /Descargar/ })).toBeNull();
        fireEvent.click(dialogo.getByRole('button', { name: 'Cerrar' }));

        fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: sumarDias(hoy, -1) } });
        expect(screen.getByRole('alert')).toHaveTextContent('La fecha Hasta debe ser igual o posterior');
        expect(screen.queryByRole('table', { name: 'Órdenes de laboratorio' })).toBeNull();
    });

    it('ofrece la descarga por examen y solicita un enlace firmado al pulsar el botón', async () => {
        entorno.demo = false;
        const persona = { id: 'p1', nombres: 'Ana', apellidos: 'Rivas' };
        const fecha = '2026-11-14T15:00:00Z';
        const examenes = [
            { id: 'e1', nombre: 'Hemograma', resultado: { tiene_archivo: true, tipo_archivo: 'pdf' } },
            { id: 'e2', nombre: 'Química sanguínea', resultado: { tiene_archivo: true, tipo_archivo: 'imagen' } },
            { id: 'e3', nombre: 'Examen de orina', resultado: { tiene_archivo: false, tipo_archivo: null } },
        ].map(({ id, nombre, resultado }) => ({
            id, examen: { nombre }, resultado, estado: 'completado', fecha_inicio: fecha, fecha_completado: fecha,
        }));
        entorno.apiFetch.mockResolvedValueOnce({
            id: 'orden', paciente: persona, doctor: persona, fecha_solicitud: fecha, estado: 'completado', examenes,
        }).mockRejectedValueOnce(new Error('Error de conexión'))
            .mockResolvedValueOnce({ url: 'https://storage.example/resultado.png?token=firmado' });
        const descarga = vi.fn<(href: string) => void>();
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            descarga(this.href);
        });
        render(<OrdenLaboratorioDialog id="orden" onClose={() => {}} />);

        const imagen = await screen.findByRole('button', { name: 'Descargar imagen de Química sanguínea' });
        expect(screen.getByRole('button', { name: 'Descargar PDF de Hemograma' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Descargar.*Examen de orina/ })).toBeNull();
        expect(entorno.apiFetch).toHaveBeenCalledExactlyOnceWith('/laboratorio/ordenes/orden');
        fireEvent.click(imagen);
        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo preparar la descarga');
        fireEvent.click(imagen);
        await waitFor(() => expect(descarga).toHaveBeenCalledTimes(1));
        expect(entorno.apiFetch).toHaveBeenLastCalledWith('/laboratorio/ordenes/orden/examenes/e2/resultado/archivo');
        expect(descarga).toHaveBeenCalledWith('https://storage.example/resultado.png?token=firmado&download=');
    });

    it('restringe la ruta a administración', async () => {
        abrirLaboratorio('recepcionista@hospital.test');
        expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
        expect(screen.queryByRole('table', { name: 'Órdenes de laboratorio' })).toBeNull();
    });
});
