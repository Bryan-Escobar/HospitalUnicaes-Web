import { useState } from 'react';
import { Plus, UserRoundSearch } from 'lucide-react';

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
import { listarPersonal, PAGE_SIZE, resumenPersonal, tiposDePersonal, type FiltroPersonal } from '@/services/admin.service';
import type { PersonaPersonal } from '@/types/admin.types';

const columnas: Column<PersonaPersonal>[] = [
    {
        header: 'Nombre',
        skeleton: 'w-40',
        cell: (p) => (
            <span className="flex items-center gap-3">
                <Avatar name={p.nombre} size="sm" />
                <span className="font-semibold whitespace-nowrap">{p.nombre}</span>
            </span>
        ),
    },
    { header: 'Correo', cell: (p) => p.correo ?? <span className="text-subtle-foreground">—</span>, skeleton: 'w-44' },
    {
        header: 'Rol',
        cell: (p) => (
            <>
                {p.rol ?? <span className="text-subtle-foreground">—</span>}
                {/* A 1280 px el tipo va bajo el rol para que la tabla no desborde */}
                <Badge className="mt-1 flex w-fit 2xl:hidden">{p.tipo}</Badge>
            </>
        ),
    },
    { header: 'Tipo · especialidad', className: 'hidden 2xl:table-cell', cell: (p) => <Badge>{p.tipo}</Badge> },
    {
        header: 'Cuenta',
        className: 'whitespace-nowrap',
        cell: (p) => (p.conCuenta ? 'Con cuenta' : <span className="text-muted-foreground">Solo turnos</span>),
    },
    { header: 'Estado', cell: (p) => <StatusBadge estado={p.activo ? 'activo' : 'inactivo'} /> },
    {
        header: '',
        className: 'text-right w-24',
        cell: () => (
            <Button variant="link" size="sm">
                Editar
            </Button>
        ),
    },
];

// WEB-3 Usuarios y personal: cuentas de acceso y personal que solo tiene turnos.
export default function UsuariosPage() {
    const [filtro, setFiltro] = useState<FiltroPersonal>({
        busqueda: '',
        rol: 'todos',
        tipo: 'todos',
        estado: 'todos',
        cuenta: 'todos',
        page: 1,
    });
    const personal = useResource(() => listarPersonal(filtro), [filtro]);
    const resumen = resumenPersonal();
    const cambiar = (parcial: Partial<FiltroPersonal>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));
    const hayFiltros = filtro.busqueda !== '' || filtro.rol !== 'todos' || filtro.tipo !== 'todos' || filtro.estado !== 'todos' || filtro.cuenta !== 'todos';

    return (
        <>
            <PageHeader
                title="Usuarios y personal"
                subtitle={`${resumen.total} personas · ${resumen.conCuenta} con cuenta de acceso`}
                actions={
                    <Button>
                        <Plus /> Nuevo usuario o personal
                    </Button>
                }
            />
            <Toolbar>
                <SearchInput
                    className="w-56 2xl:w-72"
                    placeholder="Buscar por nombre o correo"
                    aria-label="Buscar por nombre o correo"
                    value={filtro.busqueda}
                    onChange={(e) => cambiar({ busqueda: e.target.value })}
                />
                <Select className="w-40" aria-label="Rol" value={filtro.rol} onChange={(e) => cambiar({ rol: e.target.value })}>
                    <option value="todos">Rol: Todos</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Recepcionista/Asistente">Recepcionista/Asistente</option>
                </Select>
                <Select className="w-44" aria-label="Tipo de personal" value={filtro.tipo} onChange={(e) => cambiar({ tipo: e.target.value })}>
                    <option value="todos">Tipo de personal</option>
                    {tiposDePersonal().map((t) => (
                        <option key={t}>{t}</option>
                    ))}
                </Select>
                <Select
                    className="w-40"
                    aria-label="Estado"
                    value={filtro.estado}
                    onChange={(e) => cambiar({ estado: e.target.value as FiltroPersonal['estado'] })}
                >
                    <option value="todos">Estado: Todos</option>
                    <option value="activos">Estado: Activos</option>
                    <option value="inactivos">Estado: Inactivos</option>
                </Select>
                <Select
                    className="w-40"
                    aria-label="Tipo de cuenta"
                    value={filtro.cuenta}
                    onChange={(e) => cambiar({ cuenta: e.target.value as FiltroPersonal['cuenta'] })}
                >
                    <option value="todos">Cuenta: Todas</option>
                    <option value="con_cuenta">Con cuenta</option>
                    <option value="solo_turnos">Solo turnos</option>
                </Select>
            </Toolbar>

            <DataTable
                label="Usuarios y personal"
                columns={columnas}
                rows={personal.data?.items}
                status={personal.status}
                rowKey={(p) => p.id}
                onRetry={personal.refetch}
                empty={
                    hayFiltros
                        ? {
                              icon: UserRoundSearch,
                              title: 'Sin coincidencias',
                              description: 'Ninguna persona coincide con los filtros. Prueba con otro nombre o quita filtros.',
                          }
                        : {
                              title: 'Todavía no hay personal registrado',
                              description: 'Registra a doctores, recepción y demás personal para asignarles turnos y cuentas.',
                              action: (
                                  <Button>
                                      <Plus /> Nuevo usuario o personal
                                  </Button>
                              ),
                          }
                }
                footer={
                    personal.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={personal.data.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />
        </>
    );
}
