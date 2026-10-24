import { useState } from 'react';
import { PackageSearch, Plus, TriangleAlert } from 'lucide-react';

import { KpiCard } from '@/components/KpiCard';
import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterChip } from '@/components/ui/filter-chip';
import { SearchInput } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/utils';
import {
    categoriasInventario,
    listarRecursos,
    obtenerResumenInventario,
    PAGE_SIZE,
    ubicacionesInventario,
    type FiltroInventario,
} from '@/services/admin.service';
import type { Recurso } from '@/types/admin.types';

const stockBajo = (r: Recurso) => r.cantidad < r.minimo;

const columnas: Column<Recurso>[] = [
    { header: 'Recurso', skeleton: 'w-44', cell: (r) => <span className="font-semibold">{r.nombre}</span> },
    { header: 'Categoría', cell: (r) => r.categoria },
    {
        header: 'Cantidad',
        cell: (r) => <span className={cn('tabular', stockBajo(r) && 'font-bold text-warning-ink')}>{r.cantidad}</span>,
    },
    { header: 'Mínimo', cell: (r) => <span className="tabular">{r.minimo}</span> },
    { header: 'Ubicación', cell: (r) => r.ubicacion },
    {
        header: 'Alerta',
        cell: (r) => (stockBajo(r) ? <StatusBadge estado="stock_bajo" /> : <span className="text-subtle-foreground">—</span>),
    },
    {
        header: '',
        className: 'text-right w-36',
        cell: () => (
            <span className="inline-flex items-center gap-1.5 text-[13px]">
                <Button variant="link" size="sm">
                    Editar
                </Button>
                <span aria-hidden className="text-muted-foreground">·</span>
                <Button variant="link-danger" size="sm">
                    Eliminar
                </Button>
            </span>
        ),
    },
];

// WEB-7 Inventario y recursos: existencias por categoría y alertas de stock bajo.
export default function InventarioPage() {
    const [filtro, setFiltro] = useState<FiltroInventario>({
        busqueda: '',
        categoria: 'todas',
        ubicacion: 'todas',
        soloStockBajo: false,
        page: 1,
    });
    const resumen = useResource(obtenerResumenInventario);
    const recursos = useResource(() => listarRecursos(filtro), [filtro]);
    const cambiar = (parcial: Partial<FiltroInventario>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));
    const hayFiltros = filtro.busqueda !== '' || filtro.categoria !== 'todas' || filtro.ubicacion !== 'todas' || filtro.soloStockBajo;
    const r = resumen.data;
    const estadoKpi = resumen.status === 'empty' ? 'success' : resumen.status;

    return (
        <>
            <PageHeader
                title="Inventario y recursos"
                actions={
                    <Button>
                        <Plus /> Nuevo recurso
                    </Button>
                }
            />
            <section aria-label="Resumen de inventario" className="mb-5 grid grid-cols-4 gap-4">
                <KpiCard label="Recursos registrados" status={estadoKpi} value={r?.registrados} footer={r && `En ${r.categorias} categorías`} />
                <KpiCard
                    label={
                        <>
                            <TriangleAlert className="size-3.5 text-warning-ink" aria-hidden /> Con stock bajo
                        </>
                    }
                    status={estadoKpi}
                    value={r?.stockBajo}
                    footer="Por debajo del mínimo"
                    highlight={!!r && r.stockBajo > 0 && estadoKpi === 'success'}
                />
                <KpiCard label="Categorías" status={estadoKpi} value={r?.categorias} footer="Insumos, equipos, medicamentos…" />
                <KpiCard
                    label="Última actualización"
                    status={estadoKpi}
                    value={r?.registrados ? r.ultimaActualizacion : '—'}
                    footer={r?.registrados ? `Por ${r.actualizadoPor}` : 'Sin movimientos'}
                />
            </section>

            <Toolbar>
                <SearchInput
                    className="w-72"
                    placeholder="Buscar recurso"
                    aria-label="Buscar recurso"
                    value={filtro.busqueda}
                    onChange={(e) => cambiar({ busqueda: e.target.value })}
                />
                <Select aria-label="Categoría" value={filtro.categoria} onChange={(e) => cambiar({ categoria: e.target.value })}>
                    <option value="todas">Categoría</option>
                    {categoriasInventario().map((c) => (
                        <option key={c}>{c}</option>
                    ))}
                </Select>
                <Select aria-label="Ubicación" value={filtro.ubicacion} onChange={(e) => cambiar({ ubicacion: e.target.value })}>
                    <option value="todas">Ubicación</option>
                    {ubicacionesInventario().map((u) => (
                        <option key={u}>{u}</option>
                    ))}
                </Select>
                <FilterChip
                    className="h-10 rounded-md"
                    selected={filtro.soloStockBajo}
                    onClick={() => cambiar({ soloStockBajo: !filtro.soloStockBajo })}
                >
                    {!filtro.soloStockBajo && <TriangleAlert className="size-3.5" />} Solo stock bajo
                </FilterChip>
            </Toolbar>

            <DataTable
                label="Inventario"
                columns={columnas}
                rows={recursos.data?.items}
                status={recursos.status}
                rowKey={(x) => x.id}
                onRetry={recursos.refetch}
                skeletonRows={9}
                empty={
                    hayFiltros
                        ? {
                              icon: PackageSearch,
                              title: filtro.soloStockBajo ? 'Ningún recurso con stock bajo' : 'Sin coincidencias',
                              description: filtro.soloStockBajo
                                  ? 'Todas las existencias están sobre su mínimo.'
                                  : 'Ningún recurso coincide con la búsqueda o los filtros.',
                          }
                        : {
                              title: 'El inventario está vacío',
                              description: 'Registra insumos, equipos y medicamentos con su cantidad mínima para recibir alertas.',
                              action: (
                                  <Button>
                                      <Plus /> Nuevo recurso
                                  </Button>
                              ),
                          }
                }
                footer={
                    recursos.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE - 1}
                            total={recursos.data.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />
        </>
    );
}
