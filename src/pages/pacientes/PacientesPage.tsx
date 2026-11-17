import { useLayoutEffect, useRef, useState } from 'react';
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
import { ALFABETO_ES, inicialApellido } from '@/lib/alfabeto-pacientes';
import { listarPacientesParaAlfabeto, PACIENTES_POR_PAGINA } from '@/services/pacientes.service';
import type { FiltroPacientes, PacienteListado } from '@/types/pacientes.types';

function columnas(filtro: FiltroPacientes): Column<PacienteListado>[] {
    return [
        {
            header: 'Apellidos y nombres',
            cell: (p) => (
                <span className="flex items-center gap-3">
                    <Avatar name={`${p.nombres} ${p.apellidos}`} size="sm" />
                    <span className="font-semibold">{p.apellidos}, {p.nombres}</span>
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

function desplazarAGrupo(tabla: HTMLDivElement | null, letra: string) {
    const grupo = tabla?.querySelector<HTMLElement>(`[data-row-group="${letra}"]`);
    grupo?.focus({ preventScroll: true });
    grupo?.scrollIntoView?.({ block: 'start' });
}

function ListadoPacientes({ filtroInicial }: { filtroInicial: FiltroPacientes }) {
    const [filtro, setFiltro] = useState(filtroInicial);
    const tabla = useRef<HTMLDivElement>(null);
    const saltoPendiente = useRef<string | null>(null);
    const { busqueda, estado, hospitalizacion, page } = filtro;
    const pacientes = useResource(
        () => listarPacientesParaAlfabeto({ busqueda, estado, hospitalizacion }),
        [busqueda, estado, hospitalizacion],
    );
    const resultados = pacientes.data ?? [];
    const desde = (page - 1) * PACIENTES_POR_PAGINA;
    const filas = resultados.slice(desde, desde + PACIENTES_POR_PAGINA);
    const paginasPorInicial = new Map<string, number>();
    if (pacientes.status === 'success') {
        resultados.forEach((paciente, indice) => {
            const letra = inicialApellido(paciente.apellidos);
            if (!paginasPorInicial.has(letra)) {
                paginasPorInicial.set(letra, Math.floor(indice / PACIENTES_POR_PAGINA) + 1);
            }
        });
    }
    const hayFiltros = Boolean(busqueda.trim()) || estado !== 'todos' || hospitalizacion !== 'todas';

    useLayoutEffect(() => {
        if (saltoPendiente.current) {
            desplazarAGrupo(tabla.current, saltoPendiente.current);
            saltoPendiente.current = null;
        }
    }, [page]);

    function cambiar(parcial: Partial<FiltroPacientes>) {
        saltoPendiente.current = null;
        setFiltro((actual) => ({ ...actual, page: 1, ...parcial }));
    }

    function irAGrupo(letra: string, pagina: number) {
        if (pagina === page) {
            desplazarAGrupo(tabla.current, letra);
            return;
        }
        saltoPendiente.current = letra;
        setFiltro((actual) => ({ ...actual, page: pagina }));
    }

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

            <div role="group" aria-label="Inicial del apellido" className="mb-4 flex flex-wrap gap-1">
                {ALFABETO_ES.map((letra) => {
                    const pagina = paginasPorInicial.get(letra);
                    return (
                        <Button key={letra} type="button" size="sm" variant="outline" className="min-w-8 px-0"
                            disabled={pagina === undefined} onClick={() => pagina !== undefined && irAGrupo(letra, pagina)}>
                            {letra}
                        </Button>
                    );
                })}
            </div>
            <div ref={tabla}>
                <DataTable
                    label="Pacientes"
                    columns={columnas(filtro)}
                    rows={filas}
                    status={pacientes.status === 'success' && filas.length === 0 ? 'empty' : pacientes.status}
                    rowKey={(p) => p.id}
                    groupBy={(p) => inicialApellido(p.apellidos)}
                    onRetry={pacientes.refetch}
                    empty={page > 1 ? {
                        title: 'Sin resultados en esta página',
                        action: <Button variant="outline" onClick={() => cambiar({ page: 1 })}>Volver a la primera página</Button>,
                    } : hayFiltros ? { icon: UserRoundSearch, title: 'Sin coincidencias' } : { title: 'Todavía no hay pacientes' }}
                    footer={pacientes.data && (
                        <Pagination
                            page={page}
                            pageSize={PACIENTES_POR_PAGINA}
                            total={resultados.length}
                            onPageChange={(page) => cambiar({ page })}
                        />
                    )}
                />
            </div>
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
