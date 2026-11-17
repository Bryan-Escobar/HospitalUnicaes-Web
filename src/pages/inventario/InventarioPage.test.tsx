import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fechaHospital, sumarDias } from '@/lib/fechas-hospital';
import type { Activo, ItemInventario, LoteInventario, Proveedor } from '@/types/inventario.types';

import InventarioPage from './InventarioPage';

vi.hoisted(() => vi.stubEnv('VITE_API_URL', 'http://api.test/api'));

vi.mock('@/lib/client', () => ({
    isDemoMode: false,
    supabase: {
        auth: { getSession: async () => ({ data: { session: { access_token: 'sesion-admin' } } }) },
    },
}));

const item: ItemInventario = {
    id: 'med', codigo: 'MED-001', nombre: 'Paracetamol', categoria: 'medicamento', tipo_control: 'lote',
    activo: true, unidad_medida: 'tabletas', stock_actual: 12, stock_minimo: 20, bajo_minimo: true, ubicacion: 'Farmacia',
};
const vencido: LoteInventario = {
    id: 'lote-v', numero_lote: 'VENCIDO-01', fecha_caducidad: sumarDias(fechaHospital(), -1),
    cantidad_actual: 4, dias_restantes: -1, vencido: true, alerta: 'vencido',
};
const vigente: LoteInventario = {
    id: 'lote-f', numero_lote: 'VIGENTE-02', fecha_caducidad: sumarDias(fechaHospital(), 10),
    cantidad_actual: 8, dias_restantes: 10, vencido: false, alerta: '15_dias',
};
const proveedor: Proveedor = {
    id: 'prov', nombre: 'Distribuidora Test', nit: null, nrc: null, telefono: null,
    email: null, contacto: null, direccion: null, activo: true,
};
const activo: Activo = {
    id: 'activo', numero_serie: 'SERIE-001', estado: 'disponible', ubicacion: 'Farmacia',
    item: { id: 'eq', codigo: 'EQP-01', nombre: 'Monitor' }, proveedor,
};
const pagina = <T,>(items: T[]) => ({ items, paginacion: { total: items.length } });
const exito = (data: unknown, status = 200) => Response.json({ data }, { status });

function iniciar(url = '/inventario', override?: (ruta: URL, init?: RequestInit) => Response | undefined) {
    const fetchApi = vi.fn(async (input: string, init?: RequestInit) => {
        const ruta = new URL(input);
        const respuesta = override?.(ruta, init);
        if (respuesta) return respuesta;
        switch (ruta.pathname) {
            case '/api/inventario': return exito(pagina([item]));
            case '/api/inventario/med': return exito(item);
            case '/api/inventario/med/lotes': return exito([vencido, vigente]);
            case '/api/inventario/lotes-por-vencer': return exito({
                resumen: { vencidos: 1, en_15_dias: 1, en_30_dias: 0 },
                items: [{ ...vencido, lote_id: vencido.id, item }, { ...vigente, lote_id: vigente.id, item }],
            });
            case '/api/proveedores': return exito(pagina([proveedor]));
            case '/api/activos': return exito(pagina([activo]));
            default: throw new Error(`Petición inesperada a ${ruta.pathname}`);
        }
    });
    vi.stubGlobal('fetch', fetchApi);
    render(<MemoryRouter initialEntries={[url]}><InventarioPage /></MemoryRouter>);
    return fetchApi;
}

describe('Inventario web', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('filtra el stock bajo y edita el catálogo sin enviar el stock calculado', async () => {
        const fetchApi = iniciar('/inventario?stock=bajo', (ruta, init) =>
            ruta.pathname === '/api/inventario/med' && init?.method === 'PATCH' ? exito(item) : undefined);
        expect(await screen.findByText('12 tabletas')).toBeInTheDocument();
        expect(fetchApi.mock.calls.some(([url]) => new URL(url).searchParams.get('bajo_minimo') === 'true')).toBe(true);

        fireEvent.click(screen.getByRole('button', { name: 'Editar Paracetamol' }));
        const dialogo = screen.getByRole('dialog');
        expect(within(dialogo).queryByLabelText('Stock total')).not.toBeInTheDocument();
        fireEvent.change(within(dialogo).getByLabelText('Stock mínimo'), { target: { value: '30' } });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }));

        expect(await screen.findByText('Ítem actualizado.')).toBeInTheDocument();
        const patch = fetchApi.mock.calls.find(([, init]) => init?.method === 'PATCH')?.[1];
        expect(JSON.parse(String(patch?.body))).toEqual({
            codigo: 'MED-001', nombre: 'Paracetamol', categoria: 'medicamento',
            unidad_medida: 'tabletas', stock_minimo: 30, ubicacion: 'Farmacia',
        });
        expect(new Headers(patch?.headers).get('Authorization')).toBe('Bearer sesion-admin');
    });

    it('mantiene el orden FEFO y solo ofrece descarte para el lote vencido', async () => {
        const fetchApi = iniciar('/inventario?item=med', (ruta) =>
            ruta.pathname.endsWith('/ajustes') ? exito({}, 201) : undefined);
        const filaVencida = await screen.findByRole('row', { name: /VENCIDO-01/ });
        const filas = within(screen.getByRole('table', { name: 'Lotes del ítem' })).getAllByRole('row');
        expect(filas[1]).toBe(filaVencida);
        expect(within(filaVencida).queryByRole('button', { name: /salida/i })).not.toBeInTheDocument();
        expect(within(filas[2]).getByRole('button', { name: /Registrar salida/ })).toBeInTheDocument();

        fireEvent.click(within(filaVencida).getByRole('button', { name: /Descartar/ }));
        const dialogo = screen.getByRole('dialog');
        fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'Vencimiento' } });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Descartar unidades vencidas' }));

        expect(await screen.findByText('Ajuste registrado.')).toBeInTheDocument();
        const envio = fetchApi.mock.calls.find(([url]) => url.endsWith('/ajustes'))?.[1];
        expect(JSON.parse(String(envio?.body))).toEqual({ lote_id: vencido.id, cantidad: -4, motivo: 'Vencimiento' });
    });

    it('conserva el formulario y explica STOCK_INSUFICIENTE tras una salida concurrente', async () => {
        const fetchApi = iniciar('/inventario?item=med', (ruta) => ruta.pathname.endsWith('/salidas')
            ? Response.json({ code: 'STOCK_INSUFICIENTE', message: 'Conflicto' }, { status: 409 }) : undefined);
        fireEvent.click(await screen.findByRole('button', { name: 'Registrar salida del lote VIGENTE-02' }));
        const dialogo = screen.getByRole('dialog');
        fireEvent.change(within(dialogo).getByLabelText('Cantidad'), { target: { value: '5' } });
        fireEvent.change(within(dialogo).getByLabelText('Motivo'), { target: { value: 'Entrega' } });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Registrar salida' }));

        expect(await within(dialogo).findByRole('alert')).toHaveTextContent('El lote no tiene suficientes unidades.');
        expect(within(dialogo).getByLabelText('Cantidad')).toHaveValue(5);
        const envio = fetchApi.mock.calls.find(([url]) => url.endsWith('/salidas'))?.[1];
        expect(JSON.parse(String(envio?.body))).toEqual({ lote_id: vigente.id, cantidad: 5, motivo: 'Entrega' });
    });

    it('registra entradas con un proveedor activo y muestra conflictos de caducidad por code', async () => {
        const fetchApi = iniciar('/inventario?item=med', (ruta) => ruta.pathname.endsWith('/entradas')
            ? Response.json({ code: 'LOTE_CADUCIDAD_DISTINTA', message: 'Conflicto' }, { status: 409 }) : undefined);
        fireEvent.click(await screen.findByRole('button', { name: 'Registrar entrada' }));
        const dialogo = screen.getByRole('dialog');
        const proveedorSelect = await within(dialogo).findByRole('combobox', { name: 'Proveedor' });
        expect(proveedorSelect).toBeRequired();
        expect(fetchApi.mock.calls.some(([url]) => url.includes('/proveedores?') && new URL(url).searchParams.get('activo') === 'true')).toBe(true);

        const caducidad = sumarDias(fechaHospital(), 25);
        fireEvent.change(proveedorSelect, { target: { value: proveedor.id } });
        fireEvent.change(within(dialogo).getByLabelText('Número de lote'), { target: { value: vigente.numero_lote } });
        fireEvent.change(within(dialogo).getByLabelText('Fecha de caducidad'), { target: { value: caducidad } });
        fireEvent.change(within(dialogo).getByLabelText('Cantidad'), { target: { value: '2' } });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Registrar entrada' }));

        expect(await within(dialogo).findByRole('alert')).toHaveTextContent('Ese número de lote ya existe con otra fecha de caducidad.');
        const envio = fetchApi.mock.calls.find(([url]) => url.endsWith('/entradas'))?.[1];
        expect(JSON.parse(String(envio?.body))).toEqual({
            numero_lote: vigente.numero_lote, fecha_caducidad: caducidad, cantidad: 2, proveedor_id: proveedor.id,
        });
    });

    it('confirma la baja definitiva y actualiza la fila sin acciones de edición', async () => {
        let registro = activo;
        const fetchApi = iniciar('/inventario?vista=activos', (ruta, init) => {
            if (ruta.pathname === '/api/activos/activo' && init?.method === 'PATCH') {
                registro = { ...activo, estado: 'dado_de_baja' };
                return exito(registro);
            }
            if (ruta.pathname === '/api/activos') return exito(pagina([registro]));
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Dar de baja el activo SERIE-001' }));
        const dialogo = screen.getByRole('dialog');
        expect(within(dialogo).getByText(/La baja es definitiva/)).toBeInTheDocument();
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Dar de baja' }));

        const fila = await screen.findByRole('row', { name: /SERIE-001.*Dado de baja/ });
        expect(within(fila).queryByRole('button')).not.toBeInTheDocument();
        const envio = fetchApi.mock.calls.find(([, init]) => init?.method === 'PATCH')?.[1];
        expect(JSON.parse(String(envio?.body))).toEqual({ estado: 'dado_de_baja' });
    });

    it('desactiva el proveedor con el endpoint de baja lógica y mantiene el registro a la vista', async () => {
        let registro = proveedor;
        iniciar('/inventario?vista=proveedores', (ruta, init) => {
            if (ruta.pathname === '/api/proveedores/prov' && init?.method === 'DELETE') {
                registro = { ...proveedor, activo: false };
                return exito(registro);
            }
            if (ruta.pathname === '/api/proveedores') return exito(pagina([registro]));
        });
        fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Distribuidora Test' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }));
        expect(await screen.findByRole('row', { name: /Distribuidora Test.*Inactivo/i })).toBeInTheDocument();
    });

    it('abre la vista de caducidad con la alerta seleccionada desde el dashboard', async () => {
        iniciar('/inventario?vista=caducidad&alerta=vencido');
        expect(await screen.findByRole('row', { name: /VENCIDO-01/ })).toBeInTheDocument();
        expect(screen.queryByRole('row', { name: /VIGENTE-02/ })).not.toBeInTheDocument();
        fireEvent.change(screen.getByRole('combobox', { name: 'Estado de caducidad' }), { target: { value: '15_dias' } });
        await waitFor(() => expect(screen.getByRole('row', { name: /VIGENTE-02/ })).toBeInTheDocument());
    });
});
