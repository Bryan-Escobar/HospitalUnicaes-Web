import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { fechaHospital, lunesDe, sumarDias } from '@/lib/fechas-hospital';
import TurnosPage from './TurnosPage';

vi.mock('@/lib/client', () => ({ isDemoMode: true }));

async function abrirFormulario() {
    fireEvent.click(screen.getAllByRole('button', { name: 'Nuevo turno' })[0]);
    const dialog = within(screen.getByRole('dialog', { name: 'Nuevo turno' }));
    await dialog.findByRole('option', { name: /Fernando Aguilar Soto/ });
    fireEvent.change(dialog.getByLabelText('Personal'), { target: { value: 'demo-6' } });
    fireEvent.change(dialog.getByLabelText('Área'), { target: { value: 'Emergencia' } });
    fireEvent.change(dialog.getByLabelText('Tipo de turno'), { target: { value: 'noche' } });
    return dialog;
}

it('registra un turno nocturno, muestra ambas partes y rechaza otro turno que se solapa', async () => {
    render(<TurnosPage />);
    const domingo = sumarDias(lunesDe(fechaHospital()), 13);
    const lunes = sumarDias(domingo, 1);
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('No hay turnos esta semana');

    const formulario = await abrirFormulario();
    fireEvent.change(formulario.getByLabelText('Fecha de inicio'), { target: { value: domingo } });
    fireEvent.change(formulario.getByLabelText('Hora de inicio'), { target: { value: '19:00' } });
    fireEvent.change(formulario.getByLabelText('Hora de fin'), { target: { value: '07:00' } });
    fireEvent.click(formulario.getByRole('button', { name: 'Guardar turno' }));

    expect(await screen.findByText('Turno registrado')).toBeInTheDocument();
    expect(await screen.findByText('19:00–24:00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('00:00–07:00')).toBeInTheDocument();

    const siguiente = await abrirFormulario();
    expect(siguiente.getByLabelText('Fecha de inicio')).toHaveValue(lunes);
    fireEvent.change(siguiente.getByLabelText('Hora de inicio'), { target: { value: '06:00' } });
    fireEvent.change(siguiente.getByLabelText('Hora de fin'), { target: { value: '08:00' } });
    fireEvent.click(siguiente.getByRole('button', { name: 'Guardar turno' }));

    expect(await siguiente.findByRole('alert')).toHaveTextContent('Solapamiento de turnos');
    expect(siguiente.getByLabelText('Hora de inicio')).toHaveValue('06:00');
}, 10_000);
