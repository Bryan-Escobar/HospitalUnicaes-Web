import { useState } from 'react';
import { Contrast, Download, FileText, FlaskConical } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { estadoLabel } from '@/lib/estados';
import { useResource } from '@/hooks/useResource';
import { doctoresLaboratorio, listarOrdenes, PAGE_SIZE, type FiltroLaboratorio } from '@/services/admin.service';
import type { EstadoLaboratorio, OrdenLaboratorio } from '@/types/admin.types';

function Resultado({ orden }: { orden: OrdenLaboratorio }) {
    if (!orden.resultado) return <span className="text-subtle-foreground">—</span>;
    const partes = [orden.resultado.pdf && 'PDF', orden.resultado.texto && 'texto'].filter(Boolean).join(' · ');
    return (
        <a href="#" className="inline-flex items-center gap-1.5 text-primary hover:underline" onClick={(e) => e.preventDefault()}>
            <FileText className="size-4" aria-hidden />
            {partes}
        </a>
    );
}

const columnas: Column<OrdenLaboratorio>[] = [
    { header: 'Orden', cell: (o) => <span className="font-semibold tabular">#{o.id}</span>, skeleton: 'w-12' },
    { header: 'Examen', cell: (o) => o.examen, skeleton: 'w-40' },
    { header: 'Paciente', cell: (o) => o.paciente, skeleton: 'w-28' },
    { header: 'Doctor', cell: (o) => o.doctor },
    { header: 'Creada', cell: (o) => <span className="tabular">{o.creada}</span>, skeleton: 'w-12' },
    { header: 'Estado', cell: (o) => <StatusBadge estado={o.estado} /> },
    { header: 'Resultado', cell: (o) => <Resultado orden={o} /> },
];

const CHIPS: (EstadoLaboratorio | 'todas')[] = ['todas', 'pendiente', 'en_proceso', 'completado'];

// WEB-8 Laboratorio (vista global): solo consulta. Los estados avanzan desde Android.
export default function LaboratorioPage() {
    const [filtro, setFiltro] = useState<FiltroLaboratorio>({ estado: 'todas', doctor: 'todos', page: 1 });
    const ordenes = useResource(() => listarOrdenes(filtro), [filtro]);
    const conteo = ordenes.data?.conteo;

    return (
        <>
            <PageHeader
                title="Laboratorio"
                subtitle="Vista global · solo consulta (los estados se avanzan en Android)"
                actions={
                    <Button variant="outline" disabled={ordenes.status !== 'success'}>
                        <Download /> Exportar CSV
                    </Button>
                }
            />
            <Toolbar>
                <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
                    {CHIPS.map((e) => (
                        <FilterChip
                            key={e}
                            selected={filtro.estado === e}
                            onClick={() => setFiltro((f) => ({ ...f, estado: e, page: 1 }))}
                        >
                            {e === 'pendiente' && filtro.estado !== e && <span aria-hidden className="size-2.5 rounded-full border-[1.5px] border-current" />}
                            {e === 'en_proceso' && filtro.estado !== e && <Contrast aria-hidden className="size-3" />}
                            {e === 'todas' ? 'Todas' : estadoLabel(e)} {conteo && <span className="tabular">{conteo[e]}</span>}
                        </FilterChip>
                    ))}
                </div>
                <Select
                    aria-label="Doctor"
                    value={filtro.doctor}
                    onChange={(e) => setFiltro((f) => ({ ...f, doctor: e.target.value, page: 1 }))}
                    className="[&_select]:h-8"
                >
                    <option value="todos">Doctor</option>
                    {doctoresLaboratorio().map((d) => (
                        <option key={d}>{d}</option>
                    ))}
                </Select>
                <Select aria-label="Fecha" className="[&_select]:h-8" defaultValue="hoy">
                    <option value="hoy">Fecha: hoy</option>
                    <option value="semana">Fecha: esta semana</option>
                    <option value="mes">Fecha: este mes</option>
                </Select>
            </Toolbar>

            <DataTable
                label="Órdenes de laboratorio"
                columns={columnas}
                rows={ordenes.data?.items}
                status={ordenes.status}
                rowKey={(o) => o.id}
                onRetry={ordenes.refetch}
                empty={
                    filtro.estado !== 'todas' || filtro.doctor !== 'todos'
                        ? { icon: FlaskConical, title: 'No hay órdenes con ese filtro', description: 'Prueba con otro estado o doctor.' }
                        : {
                              icon: FlaskConical,
                              title: 'No hay órdenes de laboratorio',
                              description: 'Las órdenes que creen los doctores en consulta aparecerán aquí en estado Pendiente.',
                          }
                }
                footer={
                    ordenes.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={ordenes.data.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />
        </>
    );
}
