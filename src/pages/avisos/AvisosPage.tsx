import { useEffect, useState } from 'react';
import { Globe, Lock, Megaphone, Plus, SearchX } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { ApiError } from '@/lib/api';
import { fechaHoraCorta } from '@/lib/fechas-hospital';
import { eliminarAviso, listarAvisos, PAGE_SIZE } from '@/services/avisos.service';
import type { Aviso, FiltroAvisos, FiltroVigencia, FiltroVisibilidad } from '@/types/avisos.types';
import { AvisoFormDialog } from './AvisoFormDialog';

const VIGENCIAS: { value: FiltroVigencia; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'vigente', label: 'Vigentes' },
    { value: 'programado', label: 'Programados' },
    { value: 'vencido', label: 'Vencidos' },
];

const VISIBILIDADES: { value: FiltroVisibilidad; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'publicos', label: 'Públicos' },
    { value: 'internos', label: 'Internos' },
];

function Vigencia({ aviso }: { aviso: Aviso }) {
    return (
        <span className="grid gap-0.5 text-[13px] whitespace-nowrap">
            <span>
                <span className="text-muted-foreground">Desde </span>
                {fechaHoraCorta(aviso.fecha_publicacion)}
            </span>
            <span>
                <span className="text-muted-foreground">Hasta </span>
                {aviso.fecha_expiracion ? fechaHoraCorta(aviso.fecha_expiracion) : 'sin expiración'}
            </span>
        </span>
    );
}

function columnas(acciones: { editar: (a: Aviso) => void; eliminar: (a: Aviso) => void }): Column<Aviso>[] {
    return [
        {
            header: 'Aviso',
            skeleton: 'w-56',
            className: 'w-[38%]',
            cell: (a) => (
                <>
                    <span className="block font-semibold">{a.titulo}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{a.contenido}</span>
                </>
            ),
        },
        {
            header: 'Visibilidad',
            cell: (a) =>
                a.es_publico ? (
                    <Badge tone="primary">
                        <Globe className="size-3" aria-hidden /> Público
                    </Badge>
                ) : (
                    <Badge>
                        <Lock className="size-3" aria-hidden /> Interno
                    </Badge>
                ),
        },
        { header: 'Vigencia', cell: (a) => <Vigencia aviso={a} />, skeleton: 'w-40' },
        { header: 'Estado', cell: (a) => <StatusBadge estado={a.vigencia} /> },
        {
            header: '',
            className: 'text-right w-36',
            cell: (a) => (
                <span className="inline-flex items-center gap-1.5">
                    <Button variant="link" size="sm" onClick={() => acciones.editar(a)} aria-label={`Editar «${a.titulo}»`}>
                        Editar
                    </Button>
                    <span aria-hidden className="text-muted-foreground">
                        ·
                    </span>
                    <Button variant="link-danger" size="sm" onClick={() => acciones.eliminar(a)} aria-label={`Eliminar «${a.titulo}»`}>
                        Eliminar
                    </Button>
                </span>
            ),
        },
    ];
}

function mensajeDeError(error: unknown) {
    return error instanceof ApiError ? error.message : 'No se pudo completar la acción. Inténtalo de nuevo.';
}

function EliminarDialog({ aviso, onClose, onDone }: { aviso: Aviso | null; onClose: () => void; onDone: (a: Aviso) => void }) {
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => setError(null), [aviso]);

    async function confirmar() {
        if (!aviso) return;
        setEnviando(true);
        try {
            await eliminarAviso(aviso.id);
            onDone(aviso);
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Dialog
            open={aviso !== null}
            onClose={onClose}
            title="Eliminar aviso"
            description={aviso?.titulo}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={enviando}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={() => void confirmar()} disabled={enviando}>
                        {enviando ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                </>
            }
        >
            <div className="grid gap-3 text-sm">
                {error && <Alert tone="danger">{error}</Alert>}
                <p>
                    El aviso se borra definitivamente
                    {aviso?.es_publico && aviso.vigencia === 'vigente' ? ' y deja de mostrarse en la información pública' : ''}. No se
                    puede deshacer.
                </p>
                <p className="text-muted-foreground">Si solo quieres que deje de mostrarse, edítalo y ponle una fecha de expiración.</p>
            </div>
        </Dialog>
    );
}

// WEB-11 Avisos (HUNI-77): avisos generales. Los públicos vigentes son los que muestra la información
// pública sin sesión (/api/publico/estado); los internos solo los ve el personal.
export default function AvisosPage() {
    const [filtro, setFiltro] = useState<FiltroAvisos>({ vigencia: 'todos', visibilidad: 'todos', page: 1 });
    const avisos = useResource(() => listarAvisos(filtro), [filtro]);
    const [formulario, setFormulario] = useState<{ abierto: boolean; aviso: Aviso | null }>({ abierto: false, aviso: null });
    const [porEliminar, setPorEliminar] = useState<Aviso | null>(null);
    const [mensaje, setMensaje] = useState<string | null>(null);

    useEffect(() => {
        if (!mensaje) return;
        const id = setTimeout(() => setMensaje(null), 5000);
        return () => clearTimeout(id);
    }, [mensaje]);

    const cambiar = (parcial: Partial<FiltroAvisos>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));
    const hayFiltros = filtro.vigencia !== 'todos' || filtro.visibilidad !== 'todos';
    const nuevo = () => setFormulario({ abierto: true, aviso: null });
    const botonNuevo = (
        <Button onClick={nuevo}>
            <Plus /> Nuevo aviso
        </Button>
    );

    return (
        <>
            <PageHeader
                title="Avisos"
                subtitle="Los avisos públicos vigentes se muestran sin sesión en las apps. Nunca incluyen datos de pacientes."
                actions={botonNuevo}
            />
            <Toolbar>
                <div role="group" aria-label="Filtrar por vigencia" className="flex flex-wrap gap-2">
                    {VIGENCIAS.map((v) => (
                        <FilterChip key={v.value} selected={filtro.vigencia === v.value} onClick={() => cambiar({ vigencia: v.value })}>
                            {v.label}
                        </FilterChip>
                    ))}
                </div>
                <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
                <div role="group" aria-label="Filtrar por visibilidad" className="flex flex-wrap gap-2">
                    {VISIBILIDADES.map((v) => (
                        <FilterChip key={v.value} selected={filtro.visibilidad === v.value} onClick={() => cambiar({ visibilidad: v.value })}>
                            {v.label}
                        </FilterChip>
                    ))}
                </div>
            </Toolbar>
            {mensaje && (
                <Alert
                    tone="info"
                    className="mb-4"
                    action={
                        <Button size="sm" variant="ghost" onClick={() => setMensaje(null)}>
                            Cerrar
                        </Button>
                    }
                >
                    {mensaje}
                </Alert>
            )}
            <DataTable
                label="Avisos"
                columns={columnas({ editar: (a) => setFormulario({ abierto: true, aviso: a }), eliminar: setPorEliminar })}
                rows={avisos.data?.items}
                status={avisos.status}
                rowKey={(a) => a.id}
                onRetry={avisos.refetch}
                skeletonRows={4}
                empty={
                    hayFiltros
                        ? { icon: SearchX, title: 'No hay avisos con estos filtros', description: 'Prueba con otro filtro.' }
                        : {
                              icon: Megaphone,
                              title: 'No hay avisos publicados',
                              description: 'Publica horarios de visita, jornadas o comunicados internos para el personal.',
                              action: botonNuevo,
                          }
                }
                footer={
                    avisos.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={avisos.data.paginacion.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )
                }
            />
            <AvisoFormDialog
                open={formulario.abierto}
                aviso={formulario.aviso}
                onClose={() => setFormulario((f) => ({ ...f, abierto: false }))}
                onSaved={(a, accion) => {
                    setFormulario((f) => ({ ...f, abierto: false }));
                    const estado =
                        a.vigencia === 'programado'
                            ? ' Quedó programado.'
                            : a.vigencia === 'vencido'
                              ? ' Ya está vencido, no se mostrará.'
                              : a.es_publico
                                ? ' Ya se muestra en la información pública.'
                                : ' Ya lo ve el personal.';
                    setMensaje(`${accion === 'creado' ? 'Se publicó' : 'Se guardó'} «${a.titulo}».${estado}`);
                    avisos.refetch();
                }}
            />
            <EliminarDialog
                aviso={porEliminar}
                onClose={() => setPorEliminar(null)}
                onDone={(a) => {
                    setPorEliminar(null);
                    setMensaje(`Se eliminó «${a.titulo}».`);
                    // Si era el último de la página, vuelve a la anterior.
                    if (avisos.data?.items.length === 1 && filtro.page > 1) setFiltro((f) => ({ ...f, page: f.page - 1 }));
                    else avisos.refetch();
                }}
            />
        </>
    );
}
