import { ApiError, apiFetch } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import { responder } from '@/services/admin.service';
import type { Paginado } from '@/types/admin.types';
import type {
    Activo,
    AlertasInventario,
    CategoriaInventario,
    DatosActivo,
    DatosItem,
    DatosProveedor,
    EntradaLote,
    EstadoActivo,
    ItemInventario,
    LoteInventario,
    MovimientoInventario,
    MovimientoLote,
    Proveedor,
} from '@/types/inventario.types';

import * as demo from './inventario.mock';

export const POR_PAGINA = 10;

type Parametros = Record<string, string | number | boolean | undefined>;
type FiltroItem = { buscar?: string; ubicacion?: string; categoria?: CategoriaInventario; bajo_minimo?: boolean; activo?: boolean };
type FiltroActivo = { buscar?: string; item_id?: string; estado?: EstadoActivo };
type FiltroProveedor = { buscar?: string; activo?: boolean };

function consultar<T>(ruta: string, parametros: Parametros) {
    const query = new URLSearchParams();
    for (const [clave, valor] of Object.entries(parametros)) {
        const limpio = typeof valor === 'string' ? valor.trim() : valor;
        if (limpio !== '' && limpio !== undefined) query.set(clave, String(limpio));
    }
    return apiFetch<T>(query.size ? `${ruta}?${query}` : ruta);
}

async function paginar<T>(ruta: string, filtro: Parametros, pagina: number, porPagina = POR_PAGINA): Promise<Paginado<T>> {
    const { items, paginacion } = await consultar<{ items: T[]; paginacion: { total: number } }>(
        ruta, { ...filtro, pagina, por_pagina: porPagina },
    );
    return { items, total: paginacion.total };
}

async function listarOpciones<T>(ruta: string, filtro: Parametros): Promise<T[]> {
    const opciones: T[] = [];
    const porPagina = 100;
    for (let pagina = 1; ; pagina += 1) {
        const { items, total } = await paginar<T>(ruta, filtro, pagina, porPagina);
        opciones.push(...items);
        if (pagina * porPagina >= total || items.length < porPagina) return opciones;
    }
}

function guardar<T>(ruta: string, method: 'POST' | 'PATCH', datos: object) {
    return apiFetch<T>(ruta, { method, body: JSON.stringify(datos) });
}

function paginaDemo<T>(items: T[], pagina: number) {
    return responder(demo.paginar(items, pagina, POR_PAGINA), { items: [], total: 0 });
}

export function listarItems(filtro: FiltroItem, pagina: number) {
    if (!isDemoMode) return paginar<ItemInventario>('/inventario', filtro, pagina);
    return paginaDemo(demo.items.filter((item) =>
        item.activo === (filtro.activo ?? true) &&
        (!filtro.categoria || item.categoria === filtro.categoria) &&
        (!filtro.bajo_minimo || item.bajo_minimo) &&
        demo.coincide(filtro.buscar, item.codigo, item.nombre) && demo.coincide(filtro.ubicacion, item.ubicacion),
    ), pagina);
}

export const obtenerItem = (id: string) => isDemoMode
    ? responder(demo.items.find((item) => item.id === id) ?? null, null)
    : apiFetch<ItemInventario>(`/inventario/${id}`);
export const guardarItem = (datos: DatosItem, id?: string) =>
    guardar<ItemInventario>(id ? `/inventario/${id}` : '/inventario', id ? 'PATCH' : 'POST', datos);
export const cambiarEstadoItem = (id: string, activo: boolean) =>
    guardar<ItemInventario>(`/inventario/${id}`, 'PATCH', { activo });
export const listarLotes = (id: string) => isDemoMode
    ? responder(demo.lotes(id), [])
    : consultar<LoteInventario[]>(`/inventario/${id}/lotes`, { con_existencias: false });
export const listarMovimientos = (id: string, pagina: number) =>
    paginar<MovimientoInventario>('/inventario/movimientos', { item_id: id }, pagina);
export const registrarEntrada = (id: string, datos: EntradaLote) =>
    guardar<MovimientoInventario>(`/inventario/${id}/entradas`, 'POST', datos);
export const registrarMovimiento = (id: string, tipo: 'salidas' | 'ajustes', datos: MovimientoLote) =>
    guardar<MovimientoInventario>(`/inventario/${id}/${tipo}`, 'POST', datos);
export const listarAlertas = () => isDemoMode
    ? responder(demo.alertas(), demo.alertasVacias)
    : apiFetch<AlertasInventario>('/inventario/lotes-por-vencer');

export function listarActivos(filtro: FiltroActivo, pagina: number) {
    if (!isDemoMode) return paginar<Activo>('/activos', filtro, pagina);
    return paginaDemo(demo.activos.filter((activo) =>
        (!filtro.item_id || activo.item.id === filtro.item_id) &&
        (!filtro.estado || activo.estado === filtro.estado) &&
        demo.coincide(filtro.buscar, activo.numero_serie, activo.ubicacion),
    ), pagina);
}

export const listarEquiposActivos = () => listarOpciones<ItemInventario>('/inventario', { categoria: 'equipo', activo: true });
export const crearActivo = (datos: DatosActivo) => guardar<Activo>('/activos', 'POST', datos);
export const actualizarActivo = (id: string, datos: Partial<Pick<Activo, 'estado' | 'ubicacion'>>) =>
    guardar<Activo>(`/activos/${id}`, 'PATCH', datos);

export function listarProveedores(filtro: FiltroProveedor, pagina: number) {
    if (!isDemoMode) return paginar<Proveedor>('/proveedores', filtro, pagina);
    return paginaDemo(demo.proveedores.filter((proveedor) =>
        (filtro.activo === undefined || proveedor.activo === filtro.activo) &&
        demo.coincide(filtro.buscar, proveedor.nombre, proveedor.nit, proveedor.nrc),
    ), pagina);
}

export const listarProveedoresActivos = () => listarOpciones<Proveedor>('/proveedores', { activo: true });
export const guardarProveedor = (datos: DatosProveedor, id?: string) =>
    guardar<Proveedor>(id ? `/proveedores/${id}` : '/proveedores', id ? 'PATCH' : 'POST', datos);
export const cambiarEstadoProveedor = (id: string, activo: boolean) =>
    activo
        ? guardar<Proveedor>(`/proveedores/${id}`, 'PATCH', { activo })
        : apiFetch<Proveedor>(`/proveedores/${id}`, { method: 'DELETE' });

const ERRORES: Record<string, string> = {
    LOTE_VENCIDO: 'El lote está vencido. Registra un ajuste para descartar unidades.',
    STOCK_INSUFICIENTE: 'El lote no tiene suficientes unidades. Revisa sus existencias y la cantidad indicada.',
    PROVEEDOR_INVALIDO: 'El proveedor ya no está disponible. Selecciona un proveedor activo.',
    LOTE_CADUCIDAD_DISTINTA: 'Ese número de lote ya existe con otra fecha de caducidad. Verifica la fecha y el número.',
    TIPO_CONTROL_INVALIDO: 'La operación no corresponde al tipo de control del ítem. Revisa su categoría y sus registros.',
    ACTIVO_DADO_DE_BAJA: 'El activo ya fue dado de baja. La baja es definitiva.',
};

export function errorInventario(error: unknown) {
    if (!(error instanceof ApiError)) return 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.';
    const mensaje = (error.code && ERRORES[error.code]) || error.message;
    return [mensaje, ...error.errors.map(({ message }) => message)].join(' ');
}
