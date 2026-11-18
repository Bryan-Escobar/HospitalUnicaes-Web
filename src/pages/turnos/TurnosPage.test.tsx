import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { fechaHospital, lunesDe, sumarDias } from '@/lib/fechas-hospital';
import TurnosPage from './TurnosPage';

vi.mock('@/lib/client', () => ({ isDemoMode: true }));

async function abrirFormulario() {
    fireEvent.click(screen.getAllByRole('button', { name: 'Nuevo turno' })[0]);
    const dialog = within(screen.getByRole('dialog', { name: 'Nuevo turno' }));
    expect(dialog.getByRole('button', { name: 'Guardar turno' })).toBeDisabled();
    fireEvent.click(await dialog.findByRole('button', { name: /Personal: Selecciona/ }));
    const selector = within(await screen.findByRole('dialog', { name: 'Personal' }));
    const busqueda = selector.getByRole('searchbox');
    expect(busqueda).toHaveFocus();
    fireEvent.change(busqueda, { target: { value: 'Fernando Aguilar' } });
    const resultados = selector.getAllByRole('button');
    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toHaveTextContent('Fernando Aguilar Soto');
    fireEvent.click(resultados[0]);
    fireEvent.change(dialog.getByLabelText('Área'), { target: { value: 'Emergencia' } });
    fireEvent.change(dialog.getByLabelText('Tipo de turno'), { target: { value: 'noche' } });
    return dialog;
}

it('muestra el período en el encabezado y permite filtrar por varias personas', async () => {
    render(<TurnosPage />);
    const formato = new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeZone: 'UTC' });
    const lunes = lunesDe(fechaHospital());
    const periodo = (inicio: string) => formato.formatRange(
        new Date(`${inicio}T00:00:00Z`),
        new Date(`${sumarDias(inicio, 6)}T00:00:00Z`),
    );
    expect(screen.getByRole('heading', { level: 2, name: periodo(lunes) })).toBeInTheDocument();
    await screen.findByText('Lucía Herrera Gómez');
    const tabla = within(screen.getByRole('table', { name: 'Turnos de la semana' }));
    const encabezadoHoy = tabla.getByRole('columnheader', { name: /· hoy$/i });
    expect(encabezadoHoy).toHaveClass('bg-primary-ink');
    const indiceHoy = tabla.getAllByRole('columnheader').indexOf(encabezadoHoy);
    for (const fila of tabla.getAllByRole('row').slice(1)) {
        expect(within(fila).getAllByRole('cell')[indiceHoy]).toHaveClass('bg-primary-100');
    }
    fireEvent.click(screen.getByRole('button', { name: /Filtrar por persona/ }));
    const filtro = within(screen.getByRole('dialog', { name: 'Filtrar por persona' }));
    const busqueda = filtro.getByRole('searchbox');

    fireEvent.change(busqueda, { target: { value: 'lucia herrera' } });
    fireEvent.click(filtro.getByRole('checkbox', { name: /Lucía Herrera Gómez/ }));
    expect(tabla.getByText('Lucía Herrera Gómez')).toBeInTheDocument();
    expect(tabla.queryByText('Roberto Castillo Peña')).toBeNull();

    fireEvent.change(busqueda, { target: { value: 'Roberto Castillo' } });
    fireEvent.click(filtro.getByRole('checkbox', { name: /Roberto Castillo Peña/ }));
    expect(tabla.getByText('Lucía Herrera Gómez')).toBeInTheDocument();
    expect(tabla.getByText('Roberto Castillo Peña')).toBeInTheDocument();
    expect(tabla.queryByText('Fernando Aguilar Soto')).toBeNull();

    fireEvent.keyDown(busqueda, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('heading', { level: 2, name: periodo(sumarDias(lunes, 7)) })).toBeInTheDocument();
    expect(tabla.queryByRole('columnheader', { name: /· hoy$/i })).toBeNull();
    await screen.findByText('No hay turnos esta semana');
    fireEvent.click(screen.getByRole('button', { name: /2 personas seleccionadas/ }));
    const filtroSiguiente = within(screen.getByRole('dialog', { name: 'Filtrar por persona' }));
    expect(filtroSiguiente.getAllByRole('checkbox', { checked: true })).toHaveLength(2);
    fireEvent.click(filtroSiguiente.getByRole('button', { name: 'Quitar filtro de personas' }));
    expect(screen.getByRole('button', { name: /Todas las personas/ })).toBeInTheDocument();
});

it('registra un turno nocturno, muestra ambas partes y rechaza otro turno que se solapa', async () => {
    render(<TurnosPage />);
    const domingo = sumarDias(lunesDe(fechaHospital()), 13);
    const lunes = sumarDias(domingo, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('No hay turnos esta semana');

    const formulario = await abrirFormulario();
    fireEvent.change(formulario.getByLabelText('Fecha de inicio'), { target: { value: domingo } });
    const inicio = formulario.getByLabelText('Hora de inicio');
    fireEvent.change(inicio, { target: { value: '19:00' } });
    expect(inicio).toBeInvalid();
    fireEvent.change(inicio, { target: { value: '7:00 PM' } });
    fireEvent.change(formulario.getByLabelText('Hora de fin'), { target: { value: '7:00 AM' } });
    expect(formulario.getByText('El turno terminará al día siguiente.')).toBeInTheDocument();
    fireEvent.click(formulario.getByRole('button', { name: 'Guardar turno' }));

    expect(await screen.findByText('Turno registrado')).toBeInTheDocument();
    expect((await screen.findByText('7:00 PM')).parentElement).toHaveTextContent('7:00 PM – 12:00 AM');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect((await screen.findByText('12:00 AM')).parentElement).toHaveTextContent('12:00 AM – 7:00 AM');

    const siguiente = await abrirFormulario();
    expect(siguiente.getByLabelText('Fecha de inicio')).toHaveValue(lunes);
    fireEvent.change(siguiente.getByLabelText('Hora de inicio'), { target: { value: '6:00 AM' } });
    fireEvent.change(siguiente.getByLabelText('Hora de fin'), { target: { value: '8:00 AM' } });
    fireEvent.click(siguiente.getByRole('button', { name: 'Guardar turno' }));

    expect(await siguiente.findByRole('alert')).toHaveTextContent('Solapamiento de turnos');
    expect(siguiente.getByLabelText('Hora de inicio')).toHaveValue('6:00 AM');
}, 10_000);
