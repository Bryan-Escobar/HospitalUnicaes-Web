import { useEffect, useState } from 'react';
import { Plus, UserRoundSearch } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { SearchInput } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { ApiError } from '@/lib/api';
import { actualizarPersonal, desactivarPersonal, listarEspecialidades, listarPersonal, listarTiposPersonal, PAGE_SIZE } from '@/services/personal.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROL_ETIQUETA } from '@/types/auth.types';
import type { FiltroPersonal, Personal } from '@/types/personal.types';
import { PersonalFormDialog } from './PersonalFormDialog';

const nombreCompleto = (p: Personal) => `${p.nombres} ${p.apellidos}`;

const sinDato = <span className="text-subtle-foreground">—</span>;

function columnas(miPerfilId: string | undefined, acciones: { editar: (p: Personal) => void; desactivar: (p: Personal) => void; reactivar: (p: Personal) => void }): Column<Personal>[] {
    return [
        {
            header: 'Nombre',
            skeleton: 'w-40',
            cell: (p) => (
                <span className="flex items-center gap-3">
                    <Avatar name={nombreCompleto(p)} size="sm" />
                    <span>
                        <span className="block font-semibold whitespace-nowrap">{nombreCompleto(p)}</span>
                        <span className="block text-xs text-muted-foreground">{p.codigo_empleado}</span>
                    </span>
                </span>
            ),
        },
        { header: 'Correo', cell: (p) => p.email ?? sinDato, skeleton: 'w-44' },
        {
            header: 'Rol',
            cell: (p) => (
                <>
                    {p.rol ? ROL_ETIQUETA[p.rol] : sinDato}
                    {/* A 1280 px el tipo va bajo el rol para que la tabla no desborde */}
                    <Badge className="mt-1 flex w-fit 2xl:hidden">{p.tipo.nombre}</Badge>
                </>
            ),
        },
        {
            header: 'Tipo · especialidad',
            className: 'hidden 2xl:table-cell',
            cell: (p) => <Badge>{p.especialidad ? `${p.tipo.nombre} · ${p.especialidad.nombre}` : p.tipo.nombre}</Badge>,
        },
        {
            header: 'Cuenta',
            className: 'whitespace-nowrap',
            cell: (p) => (p.perfil_id ? 'Con cuenta' : <span className="text-muted-foreground">Solo turnos</span>),
        },
        { header: 'Estado', cell: (p) => <StatusBadge estado={p.activo ? 'activo' : 'inactivo'} /> },
        {
            header: '',
            className: 'text-right w-44',
            cell: (p) => (
                <span className="flex justify-end gap-4">
                    <Button variant="link" size="sm" onClick={() => acciones.editar(p)} aria-label={`Editar a ${nombreCompleto(p)}`}>
                        Editar
                    </Button>
                    {p.activo ? (
                        // El administrador no puede desactivarse a sí mismo (la API también lo impide).
                        p.perfil_id !== miPerfilId && (
                            <Button variant="link-danger" size="sm" onClick={() => acciones.desactivar(p)} aria-label={`Desactivar a ${nombreCompleto(p)}`}>
                                Desactivar
                            </Button>
                        )
                    ) : (
                        <Button variant="link" size="sm" onClick={() => acciones.reactivar(p)} aria-label={`Reactivar a ${nombreCompleto(p)}`}>
                            Reactivar
                        </Button>
                    )}
                </span>
            ),
        },
    ];
}

function mensajeDeError(error: unknown) {
    return error instanceof ApiError ? error.message : 'No se pudo completar la acción. Inténtalo de nuevo.';
}

function DesactivarDialog({ personal, onClose, onDone }: { personal: Personal | null; onClose: () => void; onDone: (p: Personal) => void }) {
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => setError(null), [personal]);

    async function confirmar() {
        if (!personal) return;
        setEnviando(true);
        try {
            onDone(await desactivarPersonal(personal.id));
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Dialog
            open={personal !== null}
            onClose={onClose}
            title="Desactivar personal"
            description={personal ? `${nombreCompleto(personal)} · ${personal.codigo_empleado}` : undefined}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={enviando}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={() => void confirmar()} disabled={enviando}>
                        {enviando ? 'Desactivando…' : 'Desactivar'}
                    </Button>
                </>
            }
        >
            <div className="grid gap-3 text-sm">
                {error && <Alert tone="danger">{error}</Alert>}
                <p>Se conservan sus turnos e historial y podrás reactivarlo más tarde.</p>
                {personal?.perfil_id && (
                    <Alert tone="warning">
                        Su cuenta <strong className="font-semibold">{personal.email}</strong> quedará bloqueada: no podrá iniciar sesión.
                    </Alert>
                )}
            </div>
        </Dialog>
    );
}

// WEB-3 Usuarios y personal (HUNI-45): alta, edición y desactivación del personal y sus cuentas.
export default function UsuariosPage() {
    const miPerfilId = useAuthStore((s) => (s.acceso?.estado === 'permitido' ? s.acceso.perfil.id : undefined));
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<FiltroPersonal>({ busqueda: '', tipo: 'todos', estado: 'todos', page: 1 });
    const personal = useResource(() => listarPersonal(filtro), [filtro]);
    const tipos = useResource(listarTiposPersonal);
    const especialidades = useResource(listarEspecialidades);

    const [formulario, setFormulario] = useState<{ abierto: boolean; personal: Personal | null }>({ abierto: false, personal: null });
    const [porDesactivar, setPorDesactivar] = useState<Personal | null>(null);
    const [aviso, setAviso] = useState<{ tono: 'info' | 'danger'; texto: string } | null>(null);

    const cambiar = (parcial: Partial<FiltroPersonal>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));

    // La búsqueda espera a que se deje de escribir para no pedir una página por tecla.
    useEffect(() => {
        const id = setTimeout(() => setFiltro((f) => (f.busqueda === busqueda ? f : { ...f, busqueda, page: 1 })), 300);
        return () => clearTimeout(id);
    }, [busqueda]);

    useEffect(() => {
        if (!aviso || aviso.tono === 'danger') return;
        const id = setTimeout(() => setAviso(null), 5000);
        return () => clearTimeout(id);
    }, [aviso]);

    const hayFiltros = filtro.busqueda.trim().length >= 2 || filtro.tipo !== 'todos' || filtro.estado !== 'todos';
    const total = personal.data?.paginacion.total;
    const nuevo = () => setFormulario({ abierto: true, personal: null });

    async function reactivar(p: Personal) {
        try {
            await actualizarPersonal(p.id, { activo: true });
            setAviso({ tono: 'info', texto: `${nombreCompleto(p)} está activo de nuevo.` });
            personal.refetch();
        } catch (e) {
            setAviso({ tono: 'danger', texto: mensajeDeError(e) });
        }
    }

    const botonNuevo = (
        <Button onClick={nuevo}>
            <Plus /> Nuevo personal
        </Button>
    );

    return (
        <>
            <PageHeader
                title="Usuarios y personal"
                subtitle={total === undefined ? 'Personal del hospital y sus cuentas de acceso' : `${total} ${total === 1 ? 'persona' : 'personas'}${hayFiltros ? ' con estos filtros' : ''}`}
                actions={botonNuevo}
            />
            <Toolbar>
                <SearchInput
                    className="w-64 2xl:w-72"
                    placeholder="Buscar por nombre o código"
                    aria-label="Buscar por nombre o código"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <Select className="w-48" aria-label="Tipo de personal" value={filtro.tipo} onChange={(e) => cambiar({ tipo: e.target.value })}>
                    <option value="todos">Tipo: Todos</option>
                    {tipos.data?.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.nombre}
                        </option>
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
            </Toolbar>

            {aviso && (
                <Alert
                    tone={aviso.tono}
                    className="mb-4"
                    action={
                        <Button size="sm" variant="ghost" onClick={() => setAviso(null)}>
                            Cerrar
                        </Button>
                    }
                >
                    {aviso.texto}
                </Alert>
            )}

            <DataTable
                label="Usuarios y personal"
                columns={columnas(miPerfilId, {
                    editar: (p) => setFormulario({ abierto: true, personal: p }),
                    desactivar: setPorDesactivar,
                    reactivar: (p) => void reactivar(p),
                })}
                rows={personal.data?.items}
                status={personal.status}
                rowKey={(p) => p.id}
                onRetry={personal.refetch}
                empty={
                    hayFiltros
                        ? {
                              icon: UserRoundSearch,
                              title: 'Sin coincidencias',
                              description: 'Nadie coincide con los filtros. Prueba con otro nombre o quita filtros.',
                          }
                        : {
                              title: 'Todavía no hay personal registrado',
                              description: 'Registra a doctores, enfermería, recepción y demás personal para asignarles turnos y cuentas.',
                              action: botonNuevo,
                          }
                }
                footer={
                    personal.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={personal.data.paginacion.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />

            <PersonalFormDialog
                open={formulario.abierto}
                personal={formulario.personal}
                tipos={tipos.data}
                especialidades={especialidades.data}
                catalogoError={tipos.status === 'error'}
                onRetryCatalogo={tipos.refetch}
                onClose={() => setFormulario((f) => ({ ...f, abierto: false }))}
                onSaved={(p, accion) => {
                    setFormulario((f) => ({ ...f, abierto: false }));
                    setAviso({
                        tono: 'info',
                        texto:
                            accion === 'creado'
                                ? `${nombreCompleto(p)} quedó registrado${p.perfil_id ? ' con cuenta de acceso' : ' (solo turnos)'}.`
                                : `Se guardaron los cambios de ${nombreCompleto(p)}.`,
                    });
                    personal.refetch();
                }}
            />
            <DesactivarDialog
                personal={porDesactivar}
                onClose={() => setPorDesactivar(null)}
                onDone={(p) => {
                    setPorDesactivar(null);
                    setAviso({ tono: 'info', texto: `${nombreCompleto(p)} quedó desactivado${p.perfil_id ? ' y ya no puede iniciar sesión' : ''}.` });
                    personal.refetch();
                }}
            />
        </>
    );
}
