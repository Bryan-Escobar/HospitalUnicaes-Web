import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { crearPersonal } from '@/services/personal.service';
import type { Personal, TipoPersonal } from '@/types/personal.types';
import { PersonalFormDialog } from './PersonalFormDialog';

vi.mock('@/services/personal.service', () => ({ crearPersonal: vi.fn() }));

beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
        observe() {}
        unobserve() {}
    });
});

afterEach(() => vi.unstubAllGlobals());

const tipos: TipoPersonal[] = [
    { id: 'doctor', nombre: 'Doctor', rol_sugerido: 'doctor', es_medico: true, activo: true },
    { id: 'enfermero', nombre: 'Enfermero/a', rol_sugerido: 'recepcionista', es_medico: false, activo: true },
];

it.each([false, true])('da de alta personal (con cuenta: %s)', async (conCuenta) => {
    const creado: Personal = {
        id: 'nuevo',
        perfil_id: conCuenta ? 'perfil' : null,
        nombres: 'Álvaro José',
        apellidos: 'López-Pérez',
        codigo_empleado: 'ENF-0042',
        tipo: { id: 'enfermero', nombre: 'Enfermero/a' },
        email: conCuenta ? 'alvaro@hospital.test' : null,
        rol: conCuenta ? 'recepcionista' : null,
        telefono: null,
        especialidad: null,
        num_licencia: null,
        fecha_contratacion: null,
        activo: true,
    };
    const alta = vi.mocked(crearPersonal);
    alta.mockReset().mockResolvedValue(creado);
    const onSaved = vi.fn();

    render(<PersonalFormDialog open personal={null} tipos={tipos} especialidades={[]}
        catalogoError={false} onRetryCatalogo={vi.fn()} onClose={vi.fn()} onSaved={onSaved} />);

    const nombres = screen.getByLabelText('Nombres');
    const apellidos = screen.getByLabelText('Apellidos');
    const codigo = screen.getByLabelText('Código de empleado');
    const tipo = screen.getByLabelText('Tipo de personal');
    fireEvent.change(nombres, { target: { value: 'álvaro josé' } });
    fireEvent.change(apellidos, { target: { value: 'lópez-pérez' } });
    expect(nombres).toHaveValue(creado.nombres);
    expect(apellidos).toHaveValue(creado.apellidos);
    expect(codigo).toBeDisabled();

    fireEvent.change(tipo, { target: { value: 'doctor' } });
    expect(screen.getByText('DOC-')).toBeVisible();
    fireEvent.change(codigo, { target: { value: '0042' } });
    fireEvent.change(tipo, { target: { value: 'enfermero' } });
    expect(screen.getByText('ENF-')).toBeVisible();
    expect(codigo).toHaveValue('0042');

    if (conCuenta) {
        fireEvent.click(screen.getByRole('switch', { name: 'Crear cuenta de acceso' }));
        fireEvent.change(screen.getByLabelText('Correo'), { target: { value: creado.email } });
        expect(screen.queryByLabelText('Contraseña generada')).toBeNull();
    }

    fireEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(alta).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
        nombres: creado.nombres,
        apellidos: creado.apellidos,
        codigo_empleado: creado.codigo_empleado,
        tipo_personal_id: creado.tipo.id,
    }));
    const [datos] = alta.mock.calls[0];

    if (conCuenta) {
        const password = await screen.findByLabelText('Contraseña generada');
        expect(datos.email).toBe(creado.email);
        expect(datos.password).toMatch(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/);
        expect(password).toHaveValue(datos.password);
        fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
        expect(screen.queryByLabelText('Contraseña generada')).toBeNull();
    } else {
        expect(datos).not.toHaveProperty('password');
        expect(datos).not.toHaveProperty('email');
    }

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(creado, 'creado'));
});
