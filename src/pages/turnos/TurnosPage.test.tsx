import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { fechaHospital, instanteHospital, lunesDe, sumarDias } from '@/lib/fechas-hospital';
import * as turnosService from '@/services/turnos.service';
import type { Turno } from '@/types/turnos.types';
import TurnosPage from './TurnosPage';

vi.mock('@/lib/client', () => ({ isDemoMode: true }));

it('actualiza la asistencia de recepción sin recargar y muestra el personal sin cuenta', async () => {
    vi.useFakeTimers();
    const fecha = fechaHospital();
    const turno: Turno = {
        id: 'turno-asistencia',
        personal_id: 'recepcion-asistencia',
        nombres: 'Ana',
        apellidos: 'Pérez',
        tipo_personal: 'Recepcionista',
        area: 'Recepción',
        fecha,
        hora_inicio: '08:00',
        hora_fin: '12:00',
        tipo_turno: 'manana',
        inicio: instanteHospital(fecha, '08:00'),
        fin: instanteHospital(fecha, '12:00'),
        estado_asistencia: 'programado',
    };
    const enfermeria: Turno = {
        ...turno,
        id: 'turno-sin-cuenta',
        personal_id: 'enfermeria-asistencia',
        nombres: 'María',
        tipo_personal: 'Enfermería',
        area: 'Hospitalización',
        estado_asistencia: 'sin_cuenta',
    };
    const listar = vi.spyOn(turnosService, 'listarTurnos')
        .mockResolvedValueOnce([turno, enfermeria])
        .mockResolvedValueOnce([{ ...turno, estado_asistencia: 'sin_conexion' }, enfermeria])
        .mockResolvedValueOnce([{ ...turno, estado_asistencia: 'presente' }, enfermeria]);
    const pantalla = render(<TurnosPage />);
    try {
        await act(async () => {});
        expect(screen.getByText('Programado').closest('li')).toHaveClass('bg-muted');
        expect(screen.getByText('Sin cuenta').closest('li')).toHaveClass('bg-muted');

        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(screen.getByText('Sin conexión').closest('li')).toHaveClass('bg-danger-soft');

        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(screen.getByText('Presente').closest('li')).toHaveClass('bg-success-soft');
    } finally {
        pantalla.unmount();
        listar.mockRestore();
        vi.useRealTimers();
    }
});

it('protege los turnos de hoy y anteriores, incluido un nocturno, y bloquea una edición abierta al cambiar de día', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T23:59:55-06:00'));
    const turno: Turno = {
        id: 'turno-hoy',
        personal_id: 'demo-6',
        nombres: 'Fernando',
        apellidos: 'Aguilar Soto',
        tipo_personal: 'Médico de emergencia',
        area: 'Emergencia',
        fecha: '2026-11-18',
        hora_inicio: '19:00',
        hora_fin: '07:00',
        tipo_turno: 'noche',
        inicio: '2026-11-18T19:00:00-06:00',
        fin: '2026-11-19T07:00:00-06:00',
        estado_asistencia: 'presente',
    };
    const turnos: Turno[] = [
        { ...turno, id: 'turno-ayer', fecha: '2026-11-17', inicio: '2026-11-17T19:00:00-06:00',
            fin: '2026-11-18T07:00:00-06:00', estado_asistencia: 'ausente' },
        turno,
        { ...turno, id: 'turno-manana', fecha: '2026-11-19', inicio: '2026-11-19T19:00:00-06:00',
            fin: '2026-11-20T07:00:00-06:00', estado_asistencia: 'programado' },
    ];
    const listar = vi.spyOn(turnosService, 'listarTurnos').mockResolvedValue(turnos);
    const pantalla = render(<TurnosPage />);
    try {
        await act(async () => {});
        expect(screen.getAllByText('Presente')).toHaveLength(2);
        expect(screen.getAllByText('Ausente')).toHaveLength(2);
        for (const accion of ['Editar', 'Eliminar']) {
            const botones = screen.getAllByRole('button', { name: new RegExp(`^${accion} turno`) });
            expect(botones).toHaveLength(2);
            expect(botones[0]).toHaveAccessibleName(/2026-11-19, 7:00 PM/);
            expect(botones[1]).toHaveAccessibleName(/2026-11-20, 12:00 AM/);
        }

        fireEvent.click(screen.getByRole('button', { name: /Editar turno.*2026-11-19, 7:00 PM/ }));
        const dialogo = within(screen.getByRole('dialog', { name: 'Editar turno' }));
        expect(dialogo.getByLabelText('Fecha de inicio')).toHaveAttribute('min', '2026-11-19');
        expect(dialogo.getByRole('button', { name: 'Guardar turno' })).toBeEnabled();

        await act(async () => vi.advanceTimersByTimeAsync(10_000));
        expect(dialogo.getByRole('button', { name: 'Guardar turno' })).toBeDisabled();
        expect(dialogo.getByRole('alert')).toHaveTextContent('Turno de solo lectura');
    } finally {
        pantalla.unmount();
        listar.mockRestore();
        vi.useRealTimers();
    }
});

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

it('edita un turno, conserva los datos al detectar un solapamiento y confirma la eliminación', async () => {
    const fecha = sumarDias(lunesDe(fechaHospital()), 21);
    const turno = {
        fecha, personal_id: 'demo-6', area: 'Emergencia',
        hora_inicio: '08:00', hora_fin: '10:00', tipo_turno: 'manana',
    } as const;
    await turnosService.crearTurno(turno);
    await turnosService.crearTurno({ ...turno, hora_inicio: '11:00', hora_fin: '13:00' });
    const registrados = await turnosService.listarTurnos(fecha, sumarDias(fecha, 1));
    const turnoEditable = registrados.find((t) => t.hora_inicio === '08:00')!;
    let eliminado = false;
    try {
        render(<TurnosPage />);
        for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
        fireEvent.click(await screen.findByRole('button', { name: /Editar turno de Fernando.*8:00 AM/ }));
        const formulario = within(screen.getByRole('dialog', { name: 'Editar turno' }));
        expect(formulario.getByLabelText('Fecha de inicio')).toHaveValue(fecha);
        expect(formulario.getByLabelText('Área')).toHaveValue('Emergencia');
        expect(formulario.getByLabelText('Hora de inicio')).toHaveValue('8:00 AM');
        const fin = formulario.getByLabelText('Hora de fin');
        fireEvent.change(fin, { target: { value: '12:00 PM' } });
        fireEvent.click(formulario.getByRole('button', { name: 'Guardar turno' }));
        expect(await formulario.findByRole('alert')).toHaveTextContent('Solapamiento de turnos');
        expect(fin).toHaveValue('12:00 PM');

        fireEvent.change(fin, { target: { value: '11:00 AM' } });
        fireEvent.click(formulario.getByRole('button', { name: 'Guardar turno' }));
        expect(await screen.findByText('Turno actualizado')).toBeInTheDocument();
        expect((await screen.findByText('8:00 AM')).parentElement).toHaveTextContent('8:00 AM – 11:00 AM');

        const eliminar = screen.getByRole('button', { name: /Eliminar turno de Fernando.*8:00 AM/ });
        fireEvent.click(eliminar);
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Eliminar turno' })).getByRole('button', { name: 'Cancelar' }));
        expect(eliminar).toBeInTheDocument();

        fireEvent.click(eliminar);
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Eliminar turno' })).getByRole('button', { name: 'Eliminar turno' }));
        expect(await screen.findByText('Turno eliminado')).toBeInTheDocument();
        eliminado = true;
        await waitFor(() => expect(screen.queryByText('8:00 AM')).not.toBeInTheDocument());
        expect(await screen.findByText('1:00 PM')).toBeInTheDocument();
    } finally {
        await Promise.all(registrados.filter((t) => !eliminado || t.id !== turnoEditable.id).map((t) => turnosService.eliminarTurno(t.id)));
    }
}, 10_000);
