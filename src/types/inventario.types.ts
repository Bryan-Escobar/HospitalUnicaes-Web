export const CATEGORIAS = {
    medicamento: 'Medicamento',
    insumo: 'Insumo',
    equipo: 'Equipo',
} as const;
export type CategoriaInventario = keyof typeof CATEGORIAS;

export const ESTADOS_ACTIVO = {
    disponible: 'Disponible',
    en_uso: 'En uso',
    en_mantenimiento: 'En mantenimiento',
    dado_de_baja: 'Dado de baja',
} as const;
export type EstadoActivo = keyof typeof ESTADOS_ACTIVO;

export const ALERTAS_CADUCIDAD = {
    vencido: 'Vencido',
    '15_dias': 'Vence en 0 a 15 días',
    '30_dias': 'Vence en 16 a 30 días',
} as const;
export type AlertaCaducidad = keyof typeof ALERTAS_CADUCIDAD;

export interface DatosItem {
    codigo: string;
    nombre: string;
    categoria: CategoriaInventario;
    unidad_medida: string;
    stock_minimo: number;
    ubicacion: string | null;
}

export interface ItemInventario extends DatosItem {
    id: string;
    tipo_control: 'lote' | 'numero_serie';
    stock_actual: number;
    bajo_minimo: boolean;
    activo: boolean;
}

export interface LoteInventario {
    id: string;
    numero_lote: string;
    fecha_caducidad: string;
    cantidad_actual: number;
    dias_restantes: number;
    vencido: boolean;
    alerta: AlertaCaducidad | null;
}

export interface EntradaLote {
    numero_lote: string;
    fecha_caducidad: string;
    cantidad: number;
    proveedor_id: string;
    motivo?: string;
}

export interface MovimientoLote {
    lote_id: string;
    cantidad: number;
    motivo: string;
}

type ProveedorResumen = { id: string; nombre: string };
type ItemResumen = Pick<ItemInventario, 'id' | 'codigo' | 'nombre'>;

export interface MovimientoInventario {
    id: string;
    tipo: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    motivo: string | null;
    lote: Pick<LoteInventario, 'id' | 'numero_lote'> | null;
    proveedor: ProveedorResumen | null;
    created_at: string;
}

export interface DatosProveedor {
    nombre: string;
    nit: string | null;
    nrc: string | null;
    contacto: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
}

export interface Proveedor extends DatosProveedor {
    id: string;
    activo: boolean;
}

export interface DatosActivo {
    item_id: string;
    numero_serie: string;
    proveedor_id: string;
    estado: Exclude<EstadoActivo, 'dado_de_baja'>;
    ubicacion: string | null;
}

export interface Activo {
    id: string;
    numero_serie: string;
    estado: EstadoActivo;
    ubicacion: string | null;
    item: ItemResumen;
    proveedor: ProveedorResumen;
}

export interface LoteConAlerta extends Omit<LoteInventario, 'id' | 'vencido' | 'alerta'> {
    lote_id: string;
    alerta: AlertaCaducidad;
    item: ItemResumen & { categoria: CategoriaInventario };
}

export interface AlertasInventario {
    resumen: { vencidos: number; en_15_dias: number; en_30_dias: number };
    items: LoteConAlerta[];
}
