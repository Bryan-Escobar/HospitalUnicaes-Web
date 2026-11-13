import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { UserRoundSearch } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { listarPacientes, PACIENTES_POR_PAGINA } from '@/services/pacientes.service';
import type { FiltroPacientes, PacienteListado } from '@/types/pacientes.types';

function columnas(filtro: FiltroPacientes): Column<PacienteListado>[] {
    return [
        {
            header: 'Paciente',
            cell: (p) => (
                <span className="flex items-center gap-3">
                    <Avatar name={`${p.nombres} ${p.apellidos}`} size="sm" />
                    <span className="font-semibold">{p.nombres} {p.apellidos}</span>
                </span>
            ),
        },
        { header: 'Estado', cell: (p) => <StatusBadge estado={p.activo ? 'activo' : 'inactivo'} /> },
        {
            header: 'Hospitalización',
            cell: (p) => {
                const habitacion = p.hospitalizaciones[0]?.camas.habitaciones;
                return habitacion ? <Badge tone="primary">{habitacion.codigo}</Badge> : 'Sin hospitalización';
            },
        },
        {
            header: '',
            className: 'w-28 text-right',
            cell: (p) => (
                <Button asChild variant="link" size="sm">
                    <Link to={`/pacientes/${p.id}`} state={{ filtro }} aria-label={`Ver ficha de ${p.nombres} ${p.apellidos}`}>
                        Ver ficha
                    </Link>
                </Button>
            ),
        },
    ];
}

function ListadoPacientes({ filtroInicial }: { filtroInicial: FiltroPacientes }) {
    const [filtro, setFiltro] = useState(filtroInicial);
    const pacientes = useResource(() => listarPacientes(filtro), [filtro]);
    const cambiar = (parcial: Partial<FiltroPacientes>) => setFiltro((actual) => ({ ...actual, page: 1, ...parcial }));
    const hayFiltros = filtro.busqueda.trim() !== '' || filtro.estado !== 'todos' || filtro.hospitalizacion !== 'todas';

    return (
        <>
            <PageHeader title="Pacientes" />
            <Toolbar>
                <SearchInput
                    className="w-72"
                    placeholder="Nombre o documento"
                    aria-label="Buscar por nombre o documento"
                    value={filtro.busqueda}
                    onChange={(e) => cambiar({ busqueda: e.target.value })}
                />
                <Select
                    aria-label="Estado del paciente"
                    value={filtro.estado}
                    onChange={(e) => cambiar({ estado: e.target.value as FiltroPacientes['estado'] })}
                >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </Select>
                <Select
                    aria-label="Hospitalización"
                    value={filtro.hospitalizacion}
                    onChange={(e) => cambiar({ hospitalizacion: e.target.value as FiltroPacientes['hospitalizacion'] })}
                >
                    <option value="todas">Cualquier hospitalización</option>
                    <option value="hospitalizados">Hospitalizados</option>
                    <option value="ambulatorios">Sin hospitalización</option>
                </Select>
            </Toolbar>

            <DataTable
                label="Pacientes"
                columns={columnas(filtro)}
                rows={pacientes.data?.items}
                status={pacientes.status}
                rowKey={(p) => p.id}
                onRetry={pacientes.refetch}
                empty={filtro.page > 1 ? {
                    title: 'Sin resultados en esta página',
                    action: <Button variant="outline" onClick={() => cambiar({ page: 1 })}>Volver a la primera página</Button>,
                } : hayFiltros ? { icon: UserRoundSearch, title: 'Sin coincidencias' } : { title: 'Todavía no hay pacientes' }}
                footer={pacientes.data && (
                    <Pagination
                        page={filtro.page}
                        pageSize={PACIENTES_POR_PAGINA}
                        total={pacientes.data.total}
                        onPageChange={(page) => cambiar({ page })}
                    />
                )}
            />
        </>
    );
}

export default function PacientesPage() {
    const [params] = useSearchParams();
    const { key, state } = useLocation();
    const filtroInicial: FiltroPacientes = state?.filtro ?? {
        busqueda: state?.busqueda ?? params.get('q') ?? '',
        estado: 'todos',
        hospitalizacion: 'todas',
        page: 1,
    };
    return <ListadoPacientes key={key} filtroInicial={filtroInicial} />;
}
