import { useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useResource } from '@/hooks/useResource';
import { ApiError } from '@/lib/api';
import { fechaHospital } from '@/lib/fechas-hospital';
import {
    actualizarActivo,
    crearActivo,
    errorInventario,
    guardarItem,
    guardarProveedor,
    listarEquiposActivos,
    listarProveedoresActivos,
    registrarEntrada,
    registrarMovimiento,
} from '@/services/inventario.service';
import {
    CATEGORIAS,
    ESTADOS_ACTIVO,
    type Activo,
    type CategoriaInventario,
    type DatosActivo,
    type ItemInventario,
    type LoteInventario,
    type Proveedor,
} from '@/types/inventario.types';

type Controles = { onClose: () => void; onSaved: (mensaje: string) => void };
const texto = (form: FormData, campo: string) => String(form.get(campo) ?? '').trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

function Campo({ label, ...props }: ComponentProps<typeof Input> & { label: string }) {
    return (
        <label className="grid gap-1.5 text-sm font-medium">
            {label}
            <Input {...props} />
        </label>
    );
}

export function OperacionDialog({
    titulo, descripcion, boton = 'Guardar', resultado, onClose, onSaved, ejecutar, children, peligro, bloqueado, onError,
}: Controles & {
    titulo: string;
    descripcion?: string;
    boton?: string;
    resultado: string;
    ejecutar: (datos: FormData) => Promise<unknown>;
    children?: ReactNode;
    peligro?: boolean;
    bloqueado?: boolean;
    onError?: (error: unknown) => void;
}) {
    const [error, setError] = useState<string>();
    const [guardando, setGuardando] = useState(false);
    const solicitud = useRef(false);

    async function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (solicitud.current || bloqueado) return;
        solicitud.current = true;
        const datos = new FormData(event.currentTarget);
        setGuardando(true);
        setError(undefined);
        try {
            await ejecutar(datos);
            onSaved(resultado);
        } catch (e) {
            setError(errorInventario(e));
            onError?.(e);
        } finally {
            solicitud.current = false;
            setGuardando(false);
        }
    }

    return (
        <Dialog open onClose={() => { if (!solicitud.current) onClose(); }} title={titulo} description={descripcion}
            className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <form className="grid gap-4" onSubmit={enviar}>
                <fieldset disabled={guardando} className="grid min-w-0 gap-4">
                    {children}
                </fieldset>
                {error && <Alert tone="danger">{error}</Alert>}
                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
                    <Button type="submit" variant={peligro ? 'destructive' : 'default'} disabled={guardando || bloqueado}>
                        {guardando ? 'Guardando…' : boton}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

export function ItemDialog({ item, ...controles }: Controles & { item?: ItemInventario }) {
    return (
        <OperacionDialog {...controles} titulo={item ? 'Editar ítem' : 'Nuevo ítem'}
            resultado={item ? 'Ítem actualizado.' : 'Ítem creado.'}
            ejecutar={(form) => guardarItem({
                codigo: texto(form, 'codigo'),
                nombre: texto(form, 'nombre'),
                categoria: texto(form, 'categoria') as CategoriaInventario,
                unidad_medida: texto(form, 'unidad_medida'),
                stock_minimo: Number(texto(form, 'stock_minimo')),
                ubicacion: opcional(form, 'ubicacion'),
            }, item?.id)}>
            <Campo label="Código" name="codigo" required maxLength={30} defaultValue={item?.codigo} />
            <Campo label="Nombre" name="nombre" required maxLength={150} defaultValue={item?.nombre} />
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium">
                    Categoría
                    <Select name="categoria" required defaultValue={item?.categoria ?? ''}>
                        <option value="" disabled>Selecciona una categoría</option>
                        {Object.entries(CATEGORIAS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </Select>
                </label>
                <Campo label="Unidad de medida" name="unidad_medida" required maxLength={30} defaultValue={item?.unidad_medida} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Stock mínimo" name="stock_minimo" type="number" min={0} max={1_000_000}
                    required defaultValue={item?.stock_minimo ?? 0} />
                <Campo label="Ubicación" name="ubicacion" maxLength={100} defaultValue={item?.ubicacion ?? ''} />
            </div>
        </OperacionDialog>
    );
}

export function ProveedorDialog({ proveedor, ...controles }: Controles & { proveedor?: Proveedor }) {
    return (
        <OperacionDialog {...controles} titulo={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
            resultado={proveedor ? 'Proveedor actualizado.' : 'Proveedor creado.'}
            ejecutar={(form) => guardarProveedor({
                nombre: texto(form, 'nombre'),
                nit: opcional(form, 'nit'),
                nrc: opcional(form, 'nrc'),
                contacto: opcional(form, 'contacto'),
                telefono: opcional(form, 'telefono'),
                email: opcional(form, 'email'),
                direccion: opcional(form, 'direccion'),
            }, proveedor?.id)}>
            <Campo label="Nombre" name="nombre" required maxLength={150} defaultValue={proveedor?.nombre} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="NIT" name="nit" pattern="[0-9]{4}-[0-9]{6}-[0-9]{3}-[0-9]" placeholder="0000-000000-000-0"
                    maxLength={17} defaultValue={proveedor?.nit ?? ''} />
                <Campo label="NRC" name="nrc" pattern="[0-9]{1,7}-[0-9]" placeholder="000000-0"
                    maxLength={9} defaultValue={proveedor?.nrc ?? ''} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Contacto" name="contacto" maxLength={100} defaultValue={proveedor?.contacto ?? ''} />
                <Campo label="Teléfono" name="telefono" type="tel" minLength={8} maxLength={20} defaultValue={proveedor?.telefono ?? ''} />
            </div>
            <Campo label="Correo" name="email" type="email" maxLength={150} defaultValue={proveedor?.email ?? ''} />
            <Campo label="Dirección" name="direccion" maxLength={250} defaultValue={proveedor?.direccion ?? ''} />
        </OperacionDialog>
    );
}

function SelectorOpciones({ label, name, opciones, vacio }: {
    label: string;
    name: string;
    opciones: ReturnType<typeof useResource<{ id: string; nombre: string }[]>>;
    vacio: string;
}) {
    if (opciones.status === 'loading') return <p role="status" className="text-sm text-muted-foreground">Cargando opciones de {label.toLowerCase()}…</p>;
    if (opciones.status === 'error') {
        return <Alert tone="danger" action={<Button type="button" size="sm" variant="outline" onClick={opciones.refetch}>Reintentar</Button>}>
            {errorInventario(opciones.error)}
        </Alert>;
    }
    if (opciones.status === 'empty') return <Alert tone="warning">{vacio}</Alert>;

    return (
        <label className="grid gap-1.5 text-sm font-medium">
            {label}
            <Select name={name} required defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                {opciones.data?.map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
            </Select>
        </label>
    );
}

function SelectorProveedor({ proveedores }: { proveedores: ReturnType<typeof useResource<Proveedor[]>> }) {
    return <SelectorOpciones label="Proveedor" name="proveedor_id" opciones={proveedores}
        vacio="Registra o activa un proveedor desde la sección Proveedores." />;
}

export function EntradaDialog({ item, ...controles }: Controles & { item: ItemInventario }) {
    const proveedores = useResource(listarProveedoresActivos);
    return (
        <OperacionDialog {...controles} titulo="Registrar entrada" descripcion={item.nombre} boton="Registrar entrada"
            resultado="Entrada registrada." bloqueado={proveedores.status !== 'success'}
            onError={(e) => { if (e instanceof ApiError && e.code === 'PROVEEDOR_INVALIDO') proveedores.refetch(); }}
            ejecutar={(form) => registrarEntrada(item.id, {
                numero_lote: texto(form, 'numero_lote'),
                fecha_caducidad: texto(form, 'fecha_caducidad'),
                cantidad: Number(texto(form, 'cantidad')),
                proveedor_id: texto(form, 'proveedor_id'),
                motivo: texto(form, 'motivo') || undefined,
            })}>
            <Campo label="Número de lote" name="numero_lote" required maxLength={50} />
            <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Fecha de caducidad" name="fecha_caducidad" type="date" min={fechaHospital()} required />
                <Campo label="Cantidad" name="cantidad" type="number" min={1} max={1_000_000} required />
            </div>
            <SelectorProveedor proveedores={proveedores} />
            <Campo label="Motivo (opcional)" name="motivo" maxLength={500} />
        </OperacionDialog>
    );
}

export function MovimientoDialog({ item, lote, tipo, ...controles }: Controles & {
    item: ItemInventario;
    lote: LoteInventario;
    tipo: 'salidas' | 'ajustes';
}) {
    const salida = tipo === 'salidas';
    const descarte = !salida && lote.vencido;
    const titulo = salida ? 'Registrar salida' : descarte ? 'Descartar unidades vencidas' : 'Registrar ajuste';
    const maximo = Math.min(lote.cantidad_actual, 1_000_000);

    return (
        <OperacionDialog {...controles} titulo={titulo} descripcion={`${item.nombre} · Lote ${lote.numero_lote} · ${lote.cantidad_actual} en existencia`}
            resultado={salida ? 'Salida registrada.' : 'Ajuste registrado.'} boton={titulo}
            ejecutar={(form) => {
                const cantidad = Number(texto(form, 'cantidad'));
                if (!cantidad) throw new ApiError(400, 'VALIDACION', 'El ajuste debe ser distinto de cero.');
                if (!descarte && cantidad > 0 && lote.fecha_caducidad < fechaHospital()) {
                    return Promise.reject(new ApiError(422, 'LOTE_VENCIDO', ''));
                }
                return registrarMovimiento(item.id, tipo, {
                    lote_id: lote.id,
                    cantidad: descarte ? -cantidad : cantidad,
                    motivo: texto(form, 'motivo'),
                });
            }}>
            <Campo label="Cantidad" name="cantidad" type="number" min={salida || descarte ? 1 : -maximo}
                max={salida || descarte ? maximo : 1_000_000} required defaultValue={descarte ? maximo : undefined}
                aria-describedby={salida || descarte ? undefined : 'cantidad-ajuste'} />
            {!salida && !descarte && (
                <p id="cantidad-ajuste" className="text-sm text-muted-foreground">Usa un valor negativo para descontar unidades y uno positivo para agregarlas.</p>
            )}
            <Campo label="Motivo" name="motivo" required maxLength={500} />
        </OperacionDialog>
    );
}

function CamposActivo({ activo, item }: { activo?: Activo; item?: ItemInventario }) {
    return (
        <>
            <label className="grid gap-1.5 text-sm font-medium">
                Estado
                <Select name="estado" defaultValue={activo?.estado ?? 'disponible'}>
                    {Object.entries(ESTADOS_ACTIVO).filter(([id]) => id !== 'dado_de_baja')
                        .map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </Select>
            </label>
            <Campo label="Ubicación" name="ubicacion" maxLength={100} defaultValue={activo?.ubicacion ?? item?.ubicacion ?? ''} />
        </>
    );
}

export function NuevoActivoDialog({ item, ...controles }: Controles & { item?: ItemInventario }) {
    const proveedores = useResource(listarProveedoresActivos);
    const equipos = useResource(() => item ? Promise.resolve([item]) : listarEquiposActivos(), [item]);

    return (
        <OperacionDialog {...controles} titulo="Registrar activo" descripcion={item?.nombre} boton="Registrar activo"
            resultado="Activo registrado." bloqueado={proveedores.status !== 'success' || (!item && equipos.status !== 'success')}
            onError={(e) => { if (e instanceof ApiError && e.code === 'PROVEEDOR_INVALIDO') proveedores.refetch(); }}
            ejecutar={(form) => crearActivo({
                item_id: item?.id ?? texto(form, 'item_id'),
                numero_serie: texto(form, 'numero_serie'),
                proveedor_id: texto(form, 'proveedor_id'),
                estado: texto(form, 'estado') as DatosActivo['estado'],
                ubicacion: opcional(form, 'ubicacion'),
            })}>
            {!item && <SelectorOpciones label="Equipo" name="item_id" opciones={equipos}
                vacio="Registra o activa un ítem de categoría Equipo en el catálogo." />}
            <Campo label="Número de serie" name="numero_serie" required maxLength={100} />
            <SelectorProveedor proveedores={proveedores} />
            <CamposActivo item={item} />
        </OperacionDialog>
    );
}

export function EditarActivoDialog({ activo, ...controles }: Controles & { activo: Activo }) {
    return (
        <OperacionDialog {...controles} titulo="Editar activo" descripcion={`${activo.item.nombre} · Serie ${activo.numero_serie}`}
            resultado="Activo actualizado."
            ejecutar={(form) => actualizarActivo(activo.id, {
                estado: texto(form, 'estado') as DatosActivo['estado'],
                ubicacion: opcional(form, 'ubicacion'),
            })}>
            <CamposActivo activo={activo} />
        </OperacionDialog>
    );
}
