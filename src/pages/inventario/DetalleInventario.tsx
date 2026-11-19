import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { ErrorState } from '@/components/ui/feedback-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { Skeleton } from '@/components/ui/skeleton';
import { useResource } from '@/hooks/useResource';
import { fechaHoraLegible } from '@/lib/fechas-hospital';
import { listarLotes, listarMovimientos, obtenerItem } from '@/services/inventario.service';
import type { ItemInventario, LoteInventario, MovimientoInventario } from '@/types/inventario.types';

import { EntradaDialog, MovimientoDialog } from './InventarioDialogs';
import { AccionesFila, CaducidadBadge, FechaInventario, TablaPaginada, type AlGuardar } from './InventarioUI';

const TIPO_MOVIMIENTO = { entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste' };
const columnasMovimientos: Column<MovimientoInventario>[] = [
    { header: 'Fecha', cell: (mov) => fechaHoraLegible(mov.created_at) },
    { header: 'Movimiento', cell: (mov) => TIPO_MOVIMIENTO[mov.tipo] },
    { header: 'Lote', cell: (mov) => mov.lote?.numero_lote ?? '—' },
    { header: 'Unidades', cell: (mov) => mov.cantidad },
    { header: 'Proveedor', cell: (mov) => mov.proveedor?.nombre ?? '—' },
    { header: 'Motivo', cell: (mov) => mov.motivo ?? '—' },
];

function HistorialLotes({ id }: { id: string }) {
    const [pagina, setPagina] = useState(1);
    const movimientos = useResource(() => listarMovimientos(id, pagina), [id, pagina]);
    return (
        <section aria-labelledby="historial-inventario" className="mt-6 space-y-3">
            <h2 id="historial-inventario" className="font-semibold">Historial de movimientos</h2>
            <TablaPaginada label="Historial de movimientos" columnas={columnasMovimientos} recurso={movimientos}
                pagina={pagina} setPagina={setPagina} vacio="Aún no hay movimientos registrados" />
        </section>
    );
}

function Lotes({ item, soloLectura, onSaved }: { item: ItemInventario; soloLectura: boolean; onSaved: AlGuardar }) {
    const [modal, setModal] = useState<{ tipo: 'entrada' } | { tipo: 'salidas' | 'ajustes'; lote: LoteInventario }>();
    const [mostrarAgotados, setMostrarAgotados] = useState(false);
    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    const [version, setVersion] = useState(0);
    const lotes = useResource(() => listarLotes(item.id), [item.id, version]);
    const filas = lotes.data?.filter((lote) => mostrarAgotados || lote.cantidad_actual > 0);
    const puedeRegistrar = item.activo && !soloLectura;

    const controles = {
        onClose: () => setModal(undefined),
        onSaved: (mensaje: string) => {
            setModal(undefined);
            setVersion((valor) => valor + 1);
            onSaved(mensaje);
        },
    };

    const columnas: Column<LoteInventario>[] = [
        { header: 'Lote', cell: (lote) => <span className="font-semibold">{lote.numero_lote}</span> },
        { header: 'Caducidad', cell: (lote) => <FechaInventario value={lote.fecha_caducidad} /> },
        { header: 'Cantidad', cell: (lote) => lote.cantidad_actual },
        { header: 'Estado', cell: (lote) => <CaducidadBadge alerta={lote.alerta} /> },
        {
            header: '',
            cell: (lote) => puedeRegistrar && (
                <AccionesFila>
                    {!lote.vencido && lote.cantidad_actual > 0 && (
                        <Button size="sm" variant="link" onClick={() => setModal({ tipo: 'salidas', lote })}
                            aria-label={`Registrar salida del lote ${lote.numero_lote}`}>Salida</Button>
                    )}
                    {(!lote.vencido || lote.cantidad_actual > 0) && (
                        <Button size="sm" variant={lote.vencido ? 'link-danger' : 'link'}
                            onClick={() => setModal({ tipo: 'ajustes', lote })}
                            aria-label={`${lote.vencido ? 'Descartar unidades del' : 'Registrar ajuste del'} lote ${lote.numero_lote}`}>
                            {lote.vencido ? 'Descartar' : 'Ajuste'}
                        </Button>
                    )}
                </AccionesFila>
            ),
        },
    ];

    return (
        <>
            <Toolbar>
                <span className="text-sm text-muted-foreground">Primero el lote que vence antes (FEFO)</span>
                <FilterChip selected={mostrarAgotados} onClick={() => setMostrarAgotados((value) => !value)}>Incluir agotados</FilterChip>
                {!soloLectura && (
                    <FilterChip selected={mostrarHistorial} onClick={() => setMostrarHistorial((value) => !value)}>Historial</FilterChip>
                )}
                {puedeRegistrar && (
                    <Button className="ml-auto" onClick={() => setModal({ tipo: 'entrada' })}><Plus /> Registrar entrada</Button>
                )}
            </Toolbar>
            <DataTable label="Lotes del ítem" columns={columnas} rows={filas}
                status={lotes.status === 'success' && filas?.length === 0 ? 'empty' : lotes.status}
                rowKey={(lote) => lote.id} onRetry={lotes.refetch}
                empty={{ title: mostrarAgotados ? 'Aún no hay lotes registrados' : 'No hay lotes con existencias' }} />
            {mostrarHistorial && <HistorialLotes key={version} id={item.id} />}
            {modal?.tipo === 'entrada' && <EntradaDialog {...controles} item={item} />}
            {modal && modal.tipo !== 'entrada' && <MovimientoDialog {...controles} item={item} lote={modal.lote} tipo={modal.tipo} />}
        </>
    );
}

export function DetalleInventario({ id, volver, version, soloLectura, onSaved }: {
    id: string;
    volver: string;
    version: number;
    soloLectura: boolean;
    onSaved: AlGuardar;
}) {
    const item = useResource(() => obtenerItem(id), [id, version]);
    const datos = item.data;
    return (
        <>
            <Button asChild variant="link" size="sm" className="mb-3 px-0">
                <Link to={volver}><ArrowLeft /> Volver al catálogo</Link>
            </Button>
            {item.status === 'error' && <ErrorState onRetry={item.refetch} />}
            {item.status === 'empty' && <p className="text-sm text-muted-foreground">No se encontró el ítem.</p>}
            {item.status === 'loading' && !datos && <Skeleton className="h-28 w-full rounded-lg" />}
            {datos && (
                <>
                    <PageHeader title={datos.nombre}
                        subtitle={`${datos.codigo} · ${datos.stock_actual} ${datos.unidad_medida} en stock${datos.ubicacion ? ` · ${datos.ubicacion}` : ''}`} />
                    {datos.tipo_control === 'lote' ? <Lotes item={datos} soloLectura={soloLectura} onSaved={onSaved} /> : (
                        <Button asChild variant="outline"><Link to={`?vista=activos&item=${datos.id}`}>Ver activos</Link></Button>
                    )}
                </>
            )}
        </>
    );
}
