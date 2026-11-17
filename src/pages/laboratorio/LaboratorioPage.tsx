import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input, SearchInput } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { estadoLabel } from '@/lib/estados';
import { fechaHospital } from '@/lib/fechas-hospital';
import { PAGE_SIZE } from '@/services/admin.service';
import { contarOrdenes, ESTADOS_LABORATORIO, listarDoctoresLaboratorio, listarOrdenes } from '@/services/laboratorio.service';
import type { FiltroLaboratorio, OrdenLaboratorio } from '@/types/laboratorio.types';
import { fechaHoraLaboratorio, nombreCompleto } from './formato-laboratorio';
import { OrdenLaboratorioDialog } from './OrdenLaboratorioDialog';

const estados = ['todas', ...ESTADOS_LABORATORIO] as const;
const filtrosIniciales = {
    estado: 'todas', doctor: '', paciente: '', examen: '', page: 1,
} satisfies Partial<FiltroLaboratorio>;

export default function LaboratorioPage() {
    const [filtro, setFiltro] = useState<FiltroLaboratorio>(() => {
        const hoy = fechaHospital();
        return { ...filtrosIniciales, desde: hoy, hasta: hoy };
    });
    const [ordenId, setOrdenId] = useState<string | null>(null);
    const { doctor, desde, hasta, paciente, examen } = filtro;
    const rangoInvalido = Boolean(desde && hasta && desde > hasta);
    const ordenes = useResource(() => rangoInvalido ? Promise.resolve(null) : listarOrdenes(filtro), [filtro]);
    const contadores = useResource(
        () => rangoInvalido ? Promise.resolve(null) : contarOrdenes({ doctor, desde, hasta, paciente, examen }),
        [doctor, desde, hasta, paciente, examen],
    );
    const doctores = useResource(listarDoctoresLaboratorio);
    const conteo = contadores.status === 'success' ? contadores.data : null;
    const total = conteo && conteo.pendiente + conteo.en_proceso + conteo.completado;
    const hayFiltros = filtro.estado !== 'todas' || Boolean(doctor || paciente || examen);
    const filtrado = hayFiltros || Boolean(desde || hasta);
    const hoy = fechaHospital();
    const soloHoy = desde === hoy && hasta === hoy;

    const actualizarFiltro = (cambios: Partial<FiltroLaboratorio>) => {
        setFiltro((actual) => ({ ...actual, ...cambios, page: 1 }));
    };

    const columnas: Column<OrdenLaboratorio>[] = [
        { header: 'Orden', cell: (o) => <span className="font-semibold tabular">#{o.id.slice(0, 8)}</span>, skeleton: 'w-16' },
        { header: 'Exámenes', cell: (o) => o.examenes.map(({ examen }) => examen.nombre).join(', ') || '—', skeleton: 'w-40' },
        { header: 'Paciente', cell: (o) => nombreCompleto(o.consulta.expediente.paciente), skeleton: 'w-28' },
        { header: 'Doctor', cell: (o) => nombreCompleto(o.consulta.doctor) },
        { header: 'Creada', cell: (o) => <time dateTime={o.fecha_solicitud}>{fechaHoraLaboratorio(o.fecha_solicitud)}</time> },
        { header: 'Estado', cell: (o) => <StatusBadge estado={o.estado} /> },
        {
            header: 'Detalle',
            cell: (o) => (
                <Button
                    variant="link"
                    aria-label={`Ver detalle de la orden #${o.id.slice(0, 8)}`}
                    onClick={() => setOrdenId(o.id)}
                >
                    Ver detalle
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader title="Laboratorio" subtitle="Consulta las órdenes de laboratorio y sus estados." />
            <Toolbar>
                <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
                    {estados.map((estado) => (
                        <FilterChip
                            key={estado}
                            selected={filtro.estado === estado}
                            onClick={() => actualizarFiltro({ estado })}
                        >
                            {estado === 'todas' ? 'Todas' : estadoLabel(estado)}
                            {' '}
                            {conteo && <span className="tabular">{estado === 'todas' ? total : conteo[estado]}</span>}
                        </FilterChip>
                    ))}
                </div>
                {!rangoInvalido && contadores.status === 'error' && (
                    <Button variant="link" onClick={contadores.refetch}>Reintentar carga de contadores</Button>
                )}
            </Toolbar>
            <Toolbar>
                <SearchInput
                    className="w-64 max-w-full"
                    placeholder="Buscar por paciente"
                    aria-label="Buscar por paciente"
                    value={paciente}
                    onChange={(e) => actualizarFiltro({ paciente: e.target.value })}
                />
                <SearchInput
                    className="w-64 max-w-full"
                    placeholder="Buscar por nombre del examen"
                    aria-label="Buscar por nombre del examen"
                    value={examen}
                    onChange={(e) => actualizarFiltro({ examen: e.target.value })}
                />
            </Toolbar>
            <Toolbar className="items-end">
                <label className="grid gap-1 text-sm font-medium">
                    Doctor
                    <Select value={doctor} onChange={(e) => actualizarFiltro({ doctor: e.target.value })}>
                        <option value="">Todos los doctores</option>
                        {doctores.data?.map((persona) => (
                            <option key={persona.id} value={persona.id}>{nombreCompleto(persona)}</option>
                        ))}
                    </Select>
                </label>
                {doctores.status === 'error' && (
                    <Button variant="outline" onClick={doctores.refetch}>Reintentar carga de doctores</Button>
                )}
                <label className="grid gap-1 text-sm font-medium">
                    Desde
                    <Input type="date" value={desde} aria-invalid={rangoInvalido}
                        onChange={(e) => actualizarFiltro({ desde: e.target.value })} />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                    Hasta
                    <Input type="date" value={hasta} aria-invalid={rangoInvalido}
                        onChange={(e) => actualizarFiltro({ hasta: e.target.value })} />
                </label>
                {!soloHoy && (
                    <Button variant="outline" onClick={() => actualizarFiltro({ desde: hoy, hasta: hoy })}>Hoy</Button>
                )}
                {hayFiltros && (
                    <Button variant="ghost" onClick={() => actualizarFiltro(filtrosIniciales)}>Limpiar filtros</Button>
                )}
            </Toolbar>

            {rangoInvalido ? (
                <p role="alert" className="text-sm text-danger">La fecha Hasta debe ser igual o posterior a la fecha Desde.</p>
            ) : (
                <DataTable
                    label="Órdenes de laboratorio"
                    columns={columnas}
                    rows={ordenes.data?.items}
                    status={ordenes.status}
                    rowKey={(o) => o.id}
                    onRetry={ordenes.refetch}
                    empty={filtrado
                        ? { icon: FlaskConical, title: 'No hay órdenes con esos filtros', description: 'Prueba otra búsqueda o cambia los filtros.' }
                        : { icon: FlaskConical, title: 'No hay órdenes de laboratorio' }}
                    footer={ordenes.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={ordenes.data.total}
                            onPageChange={(page) => setFiltro((actual) => ({ ...actual, page }))}
                        />
                    )}
                />
            )}
            {ordenId && <OrdenLaboratorioDialog key={ordenId} id={ordenId} onClose={() => setOrdenId(null)} />}
        </>
    );
}
