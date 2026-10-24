import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, UserRoundSearch } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { useResource } from '@/hooks/useResource';
import { listarPacientes, medicosTratantes, PAGE_SIZE, resumenPacientes, type FiltroPacientes } from '@/services/admin.service';
import type { Paciente } from '@/types/admin.types';

const columnas: Column<Paciente>[] = [
    {
        header: 'Paciente',
        skeleton: 'w-36',
        cell: (p) => (
            <span className="flex items-center gap-3">
                <Avatar name={p.nombre} size="sm" />
                <span className="font-semibold">{p.nombre}</span>
            </span>
        ),
    },
    { header: 'Documento', cell: (p) => <span className="tabular">{p.documento}</span> },
    { header: 'Teléfono', cell: (p) => <span className="tabular">{p.telefono}</span> },
    {
        header: 'Habitación',
        cell: (p) => (p.habitacion ? <Badge tone="primary">{p.habitacion}</Badge> : <span className="text-subtle-foreground">—</span>),
    },
    { header: 'Última consulta', cell: (p) => p.ultimaConsulta },
    {
        header: '',
        className: 'text-right w-28',
        cell: () => (
            <Button variant="link" size="sm">
                Ver ficha
            </Button>
        ),
    },
];

// WEB-4 Pacientes: listado con búsqueda y filtros. La ficha clínica completa solo la ve el médico tratante.
export default function PacientesPage() {
    const [params] = useSearchParams();
    const [filtro, setFiltro] = useState<FiltroPacientes>({
        busqueda: params.get('q') ?? '',
        hospitalizacion: 'todos',
        medico: 'todos',
        page: 1,
    });
    // La búsqueda global de la barra superior llega como ?q=
    const q = params.get('q');
    useEffect(() => {
        if (q !== null) setFiltro((f) => ({ ...f, busqueda: q, page: 1 }));
    }, [q]);
    const pacientes = useResource(() => listarPacientes(filtro), [filtro]);
    const resumen = resumenPacientes();
    const cambiar = (parcial: Partial<FiltroPacientes>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));
    const hayFiltros = filtro.busqueda !== '' || filtro.hospitalizacion !== 'todos' || filtro.medico !== 'todos';

    return (
        <>
            <PageHeader
                title="Pacientes"
                subtitle={`${resumen.total} pacientes registrados · ${resumen.hospitalizados} hospitalizados`}
                actions={
                    <Button>
                        <Plus /> Registrar paciente
                    </Button>
                }
            />
            <Toolbar>
                <SearchInput
                    className="w-72"
                    placeholder="Nombre o documento"
                    aria-label="Buscar por nombre o documento"
                    value={filtro.busqueda}
                    onChange={(e) => cambiar({ busqueda: e.target.value })}
                />
                <Select
                    aria-label="Hospitalización"
                    value={filtro.hospitalizacion}
                    onChange={(e) => cambiar({ hospitalizacion: e.target.value as FiltroPacientes['hospitalizacion'] })}
                >
                    <option value="todos">Todos</option>
                    <option value="hospitalizados">Hospitalizados</option>
                    <option value="ambulatorios">Sin hospitalización</option>
                </Select>
                <Select aria-label="Médico tratante" value={filtro.medico} onChange={(e) => cambiar({ medico: e.target.value })}>
                    <option value="todos">Médico tratante</option>
                    {medicosTratantes().map((m) => (
                        <option key={m}>{m}</option>
                    ))}
                </Select>
            </Toolbar>

            <DataTable
                label="Pacientes"
                columns={columnas}
                rows={pacientes.data?.items}
                status={pacientes.status}
                rowKey={(p) => p.id}
                onRetry={pacientes.refetch}
                empty={
                    hayFiltros
                        ? {
                              icon: UserRoundSearch,
                              title: 'Sin coincidencias',
                              description: 'Ningún paciente coincide con la búsqueda. Revisa el nombre o el DUI (00000000-0).',
                          }
                        : {
                              title: 'Todavía no hay pacientes',
                              description: 'Los pacientes se registran desde recepción (Android) o aquí mismo.',
                              action: (
                                  <Button>
                                      <Plus /> Registrar paciente
                                  </Button>
                              ),
                          }
                }
                footer={
                    pacientes.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={pacientes.data.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />
        </>
    );
}
