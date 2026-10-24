import { useMemo, useState } from 'react';
import { CalendarX2, ChevronLeft, ChevronRight, Plus, TriangleAlert } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { selectResource, useResource } from '@/hooks/useResource';
import { cn } from '@/lib/utils';
import { obtenerTurnos } from '@/services/admin.service';
import type { FilaTurnos, Turno } from '@/types/admin.types';

// Agrupación por área para la vista «Por área» y el filtro.
const AREA_POR_TIPO: Record<string, string> = {
    Alergista: 'Consulta externa',
    Doctor: 'Consulta externa',
    Emergencia: 'Emergencias',
    Enfermera: 'Enfermería',
    Asistente: 'Recepción y apoyo',
    Recepcionista: 'Recepción y apoyo',
    'Conductor (solo turnos)': 'Ambulancia',
};
const area = (f: FilaTurnos) => AREA_POR_TIPO[f.tipo] ?? 'Otras';
const HOY = 2; // Miércoles 21

function CeldaTurno({ turno }: { turno: Turno | null }) {
    if (!turno) return <span className="sr-only">Sin turno</span>;
    return (
        <span
            className={cn(
                'block rounded-sm border px-2 py-1.5 text-xs leading-4 font-medium tabular',
                turno.solapa
                    ? 'border-warning-border bg-warning-soft text-warning-ink'
                    : 'border-primary-200 bg-primary-soft text-primary-ink',
            )}
        >
            {turno.solapa ? (
                <>
                    <span className="flex items-center gap-1 font-semibold">
                        <TriangleAlert className="size-3" aria-hidden /> Solapa
                    </span>
                    {turno.horario.split(' y ').map((h) => (
                        <span key={h} className="block whitespace-nowrap">
                            {h}
                        </span>
                    ))}
                </>
            ) : (
                <span className="block whitespace-nowrap">{turno.horario}</span>
            )}
            {turno.area && <span className="block font-normal break-words">{turno.area}</span>}
        </span>
    );
}

// WEB-5 Turnos: horario semanal del personal y detección de solapamientos.
export default function TurnosPage() {
    const [vista, setVista] = useState<'persona' | 'area'>('persona');
    const [filtroArea, setFiltroArea] = useState('todas');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const semana = useResource(obtenerTurnos);

    const filas = useMemo(() => {
        const todas = semana.data?.filas ?? [];
        const filtradas = todas.filter(
            (f) => (filtroArea === 'todas' || area(f) === filtroArea) && (filtroTipo === 'todos' || f.tipo === filtroTipo),
        );
        return vista === 'area' ? [...filtradas].sort((a, b) => area(a).localeCompare(area(b))) : filtradas;
    }, [semana.data, filtroArea, filtroTipo, vista]);

    const tabla = selectResource(semana, () => filas, (v) => v.length === 0);
    const dias = semana.data?.dias ?? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const tipos = [...new Set((semana.data?.filas ?? []).map((f) => f.tipo))];
    const areas = [...new Set(Object.values(AREA_POR_TIPO))];

    const columnas: Column<FilaTurnos>[] = [
        {
            header: vista === 'area' ? 'Área · persona' : 'Persona · tipo',
            className: 'w-[200px] 2xl:w-[260px]',
            skeleton: 'w-32',
            cell: (f) => (
                <div className="py-1">
                    {vista === 'area' && <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">{area(f)}</p>}
                    <p className="font-semibold">{f.nombre}</p>
                    <Badge className="mt-1">{f.tipo}</Badge>
                </div>
            ),
        },
        ...dias.map(
            (dia, i): Column<FilaTurnos> => ({
                header: i === HOY ? `${dia} · hoy` : dia,
                className: cn('align-middle', i === HOY && 'bg-primary-soft/40 text-primary-ink'),
                skeleton: 'w-full h-7',
                cell: (f) => <CeldaTurno turno={f.dias[i] ?? null} />,
            }),
        ),
    ];

    return (
        <>
            <PageHeader
                title="Turnos"
                subtitle={semana.data?.titulo ?? 'Semana del 19 al 25 de octubre'}
                actions={
                    <>
                        <Button variant="outline">
                            <ChevronLeft /> Semana anterior
                        </Button>
                        <Button variant="outline">
                            Siguiente <ChevronRight />
                        </Button>
                        <Button>
                            <Plus /> Nuevo turno
                        </Button>
                    </>
                }
            />
            <Toolbar>
                <SegmentedControl
                    label="Agrupar turnos"
                    value={vista}
                    onChange={setVista}
                    options={[
                        { value: 'persona', label: 'Por persona' },
                        { value: 'area', label: 'Por área' },
                    ]}
                />
                <Select aria-label="Área" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                    <option value="todas">Área: Todas</option>
                    {areas.map((a) => (
                        <option key={a}>{a}</option>
                    ))}
                </Select>
                <Select aria-label="Tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                    <option value="todos">Tipo: Todos</option>
                    {tipos.map((t) => (
                        <option key={t}>{t}</option>
                    ))}
                </Select>
            </Toolbar>

            {semana.status === 'success' && semana.data?.conflicto && (
                <Alert
                    tone="warning"
                    title="Solapamiento"
                    className="mb-4"
                    action={
                        <Button variant="link" size="sm" className="text-warning-ink">
                            Editar turno
                        </Button>
                    }
                >
                    {semana.data.conflicto}
                </Alert>
            )}

            <DataTable
                label="Turnos de la semana"
                columns={columnas}
                rows={tabla.data}
                status={tabla.status}
                rowKey={(f) => f.id}
                onRetry={semana.refetch}
                skeletonRows={8}
                fixedLayout
                empty={
                    semana.status === 'empty' || (semana.data?.filas.length ?? 0) === 0
                        ? {
                              icon: CalendarX2,
                              title: 'No hay turnos esta semana',
                              description: 'Crea el primer turno o copia el horario de la semana anterior.',
                              action: (
                                  <Button>
                                      <Plus /> Nuevo turno
                                  </Button>
                              ),
                          }
                        : { title: 'Sin coincidencias', description: 'Nadie tiene turnos con esos filtros.' }
                }
            />
        </>
    );
}
