import { fechaHospital, sumarDias } from '@/lib/fechas-hospital';
import type { Paginado } from '@/types/admin.types';
import type { Activo, AlertasInventario, ItemInventario, LoteInventario, Proveedor } from '@/types/inventario.types';

export const items: ItemInventario[] = [
    {
        id: 'demo-med', codigo: 'MED-0001', nombre: 'Paracetamol 500 mg', categoria: 'medicamento',
        tipo_control: 'lote', unidad_medida: 'tabletas', stock_actual: 45, stock_minimo: 60,
        bajo_minimo: true, ubicacion: 'Farmacia', activo: true,
    },
    {
        id: 'demo-ins', codigo: 'INS-0001', nombre: 'Gasas estériles', categoria: 'insumo',
        tipo_control: 'lote', unidad_medida: 'paquetes', stock_actual: 30, stock_minimo: 35,
        bajo_minimo: true, ubicacion: 'Bodega central', activo: true,
    },
    {
        id: 'demo-eqp', codigo: 'EQP-0001', nombre: 'Monitor de signos vitales', categoria: 'equipo',
        tipo_control: 'numero_serie', unidad_medida: 'unidad', stock_actual: 1, stock_minimo: 2,
        bajo_minimo: true, ubicacion: 'Emergencias', activo: true,
    },
];

const proveedor: Proveedor = {
    id: 'demo-prov', nombre: 'Suministros Médicos Demo', nit: null, nrc: null, contacto: null,
    telefono: null, email: null, direccion: 'Santa Ana', activo: true,
};
export const proveedores = [proveedor];
export const activos: Activo[] = [{
    id: 'demo-act', numero_serie: 'MON-0001', estado: 'en_uso', ubicacion: 'Emergencias',
    item: items[2], proveedor,
}];

export function lotes(id: string): LoteInventario[] {
    const hoy = fechaHospital();
    if (id === 'demo-med') {
        return [
            { id: 'lote-1', numero_lote: 'PCT-101', cantidad_actual: 5, dias_restantes: -3,
                fecha_caducidad: sumarDias(hoy, -3), vencido: true, alerta: 'vencido' },
            { id: 'lote-2', numero_lote: 'PCT-102', cantidad_actual: 40, dias_restantes: 10,
                fecha_caducidad: sumarDias(hoy, 10), vencido: false, alerta: '15_dias' },
        ];
    }
    return id === 'demo-ins' ? [
        { id: 'lote-3', numero_lote: 'GAS-103', cantidad_actual: 30, dias_restantes: 12,
            fecha_caducidad: sumarDias(hoy, 12), vencido: false, alerta: '15_dias' },
    ] : [];
}

export const alertasVacias: AlertasInventario = { items: [], resumen: { vencidos: 0, en_15_dias: 0, en_30_dias: 0 } };

export function alertas(): AlertasInventario {
    const filas = items.flatMap((item) => lotes(item.id).flatMap(({ id, alerta, ...lote }) =>
        alerta ? [{ ...lote, lote_id: id, alerta, item }] : [],
    ));
    return {
        items: filas,
        resumen: { vencidos: 1, en_15_dias: 2, en_30_dias: 0 },
    };
}

export function coincide(buscar: string | undefined, ...valores: (string | null)[]) {
    const consulta = buscar?.trim().toLowerCase();
    return !consulta || valores.some((valor) => valor?.toLowerCase().includes(consulta));
}

export function paginar<T>(items: T[], pagina: number, porPagina: number): Paginado<T> {
    return { items: items.slice((pagina - 1) * porPagina, pagina * porPagina), total: items.length };
}
