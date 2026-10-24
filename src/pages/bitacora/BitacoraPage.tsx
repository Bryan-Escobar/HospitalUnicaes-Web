import { useState } from 'react';
import { ClipboardList, Download, FileText } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { listarBitacora, opcionesBitacora, PAGE_SIZE, type FiltroBitacora } from '@/services/admin.service';
import type { ServicioBitacora } from '@/types/admin.types';

const guion = <span className="text-subtle-foreground">—</span>;

const columnas: Column<ServicioBitacora>[] = [
    { header: 'Fecha', cell: (s) => <span className="font-semibold">{s.fecha}</span>, skeleton: 'w-12' },
    { header: 'Inicio – fin', cell: (s) => <span className="tabular">{s.inicioFin}</span>, skeleton: 'w-24' },
    { header: 'Tipo', cell: (s) => s.tipo, skeleton: 'w-36' },
    { header: 'Paciente', cell: (s) => s.paciente ?? guion, skeleton: 'w-28' },
    { header: 'Despachó', cell: (s) => s.despacho },
    { header: 'Duración', cell: (s) => (s.duracion ? <span className="tabular">{s.duracion}</span> : guion), skeleton: 'w-12' },
    { header: 'Resultado', cell: (s) => <StatusBadge estado={s.resultado} /> },
];

// WEB-10 Bitácora de ambulancia: historial de servicios con filtros y exportación.
export default function BitacoraPage() {
    const [filtro, setFiltro] = useState<FiltroBitacora>({ estado: 'todos', tipo: 'todos', despacho: 'todos', page: 1 });
    const bitacora = useResource(() => listarBitacora(filtro), [filtro]);
    const { tipos, despachos } = opcionesBitacora();
    const cambiar = (parcial: Partial<FiltroBitacora>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));
    const hayFiltros = filtro.estado !== 'todos' || filtro.tipo !== 'todos' || filtro.despacho !== 'todos';
    const exportable = bitacora.status === 'success';

    return (
        <>
            <PageHeader
                title="Bitácora de ambulancia"
                actions={
                    <>
                        <Button variant="outline" disabled={!exportable}>
                            <Download /> Exportar CSV
                        </Button>
                        <Button variant="outline" disabled={!exportable}>
                            <FileText /> Exportar PDF
                        </Button>
                    </>
                }
            />
            <Toolbar>
                <Select aria-label="Periodo" defaultValue="oct">
                    <option value="oct">01/10/2026 – 21/10/2026</option>
                    <option value="sep">01/09/2026 – 30/09/2026</option>
                    <option value="anio">01/01/2026 – 21/10/2026</option>
                </Select>
                <Select aria-label="Estado" value={filtro.estado} onChange={(e) => cambiar({ estado: e.target.value as FiltroBitacora['estado'] })}>
                    <option value="todos">Estado</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="en_mantenimiento">En Mantenimiento</option>
                    <option value="no_disponible">No disponible</option>
                </Select>
                <Select aria-label="Tipo de emergencia" value={filtro.tipo} onChange={(e) => cambiar({ tipo: e.target.value })}>
                    <option value="todos">Tipo de emergencia</option>
                    {tipos.map((t) => (
                        <option key={t}>{t}</option>
                    ))}
                </Select>
                <Select aria-label="Despachó" value={filtro.despacho} onChange={(e) => cambiar({ despacho: e.target.value })}>
                    <option value="todos">Despachó</option>
                    {despachos.map((d) => (
                        <option key={d}>{d}</option>
                    ))}
                </Select>
            </Toolbar>

            <DataTable
                label="Bitácora de ambulancia"
                columns={columnas}
                rows={bitacora.data?.items}
                status={bitacora.status}
                rowKey={(s) => s.id}
                onRetry={bitacora.refetch}
                empty={{
                    icon: ClipboardList,
                    title: hayFiltros ? 'Sin servicios con esos filtros' : 'Sin servicios en el periodo',
                    description: hayFiltros
                        ? 'Quita algún filtro o amplía el rango de fechas.'
                        : 'La ambulancia no registró servicios entre estas fechas.',
                }}
                footer={
                    bitacora.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={bitacora.data.total}
                            summary={`${bitacora.data.total} servicio${bitacora.data.total === 1 ? '' : 's'} en el periodo`}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />
        </>
    );
}
