import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Ambulance, Check, ClipboardList, Info, Pause, Play } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { ResourceView } from '@/components/ResourceView';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/feedback-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { ApiError } from '@/lib/api';
import { fechaHoraLegible } from '@/lib/fechas-hospital';
import { cn } from '@/lib/utils';
import { PAGE_SIZE } from '@/services/admin.service';
import { cambiarEstadoAmbulancia, listarSolicitudesPendientes, obtenerAmbulancia } from '@/services/ambulancia.service';
import type { EstadoAmbulancia } from '@/types/admin.types';
import { ESTADOS_SOLICITUD, PRIORIDADES_EMERGENCIA, TIPOS_EMERGENCIA } from '@/types/ambulancia.types';

const ESTADO_QUERY = ['ambulancia', 'estado'];
const ACTUALIZACION_MS = 5_000;

const ICONO_ESTADO: Record<EstadoAmbulancia, string> = {
    disponible: 'bg-success-soft text-success-ink',
    en_servicio: 'bg-danger-soft text-danger',
    en_mantenimiento: 'bg-neutral-soft text-neutral-ink',
};

function Dato({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 2xl:last:border-b-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-semibold">{value ?? '—'}</dd>
        </div>
    );
}

export default function AmbulanciaPage() {
    const queryClient = useQueryClient();
    const [pagina, setPagina] = useState(1);
    const mantenimiento = useMutation({
        mutationFn: cambiarEstadoAmbulancia,
        onSuccess: async (ambulancia) => {
            await queryClient.cancelQueries({ queryKey: ESTADO_QUERY });
            queryClient.setQueryData(ESTADO_QUERY, ambulancia);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ESTADO_QUERY }),
    });
    const recurso = useQuery({
        queryKey: ESTADO_QUERY,
        queryFn: ({ signal }) => obtenerAmbulancia(signal),
        refetchInterval: mantenimiento.isPending ? false : ACTUALIZACION_MS,
        refetchOnWindowFocus: 'always',
        gcTime: 0,
    });
    const solicitudes = useResource(
        () => listarSolicitudesPendientes(pagina), [pagina], undefined, { refreshMs: ACTUALIZACION_MS },
    );
    const ultimaPagina = Math.max(1, Math.ceil((solicitudes.data?.total ?? 0) / PAGE_SIZE));
    useEffect(() => {
        if (solicitudes.status === 'empty' && pagina > ultimaPagina) setPagina(ultimaPagina);
    }, [solicitudes.status, pagina, ultimaPagina]);
    const a = recurso.data;
    const servicio = a?.solicitud_activa;
    const puedeCambiarEstado = recurso.isSuccess && !mantenimiento.isPending;

    return (
        <>
            <PageHeader
                title="Ambulancia"
                subtitle="Unidad única del hospital"
                actions={
                    <Button variant="outline" asChild>
                        <Link to="/bitacora">
                            <ClipboardList /> Ver bitácora
                        </Link>
                    </Button>
                }
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
                <Card>
                    <CardHeader title="Estado actual de la única unidad" />
                    <CardContent className="pt-4">
                        {recurso.isPending && (
                            <div className="flex items-center gap-4" aria-hidden>
                                <Skeleton className="size-16 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-32 rounded-full" />
                                    <Skeleton className="h-3 w-44" />
                                </div>
                            </div>
                        )}
                        {recurso.isError && !a && <ErrorState compact onRetry={recurso.refetch} />}
                        {a && (
                            <div className="flex items-center gap-4">
                                <span className={cn('flex size-16 items-center justify-center rounded-xl', ICONO_ESTADO[a.estado])}>
                                    <Ambulance className="size-8" aria-hidden />
                                </span>
                                <div>
                                    <div role="status">
                                        <StatusBadge estado={a.estado} size="lg" />
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {a.placa} · Desde {fechaHoraLegible(a.updated_at)}
                                    </p>
                                </div>
                            </div>
                        )}
                        {recurso.isRefetchError && (
                            <Alert tone="warning" className="mt-3">
                                No se pudo actualizar el estado. Se muestra el último dato recibido.
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Servicio actual" />
                    <CardContent className="pt-3">
                        {recurso.isPending && <Skeleton className="h-5 w-40" />}
                        {recurso.isError && !a && <ErrorState compact onRetry={recurso.refetch} />}
                        {a && !servicio && <p className="text-sm text-muted-foreground">Sin servicio en curso.</p>}
                        {servicio && (
                            <dl className="grid grid-cols-1 gap-x-8 2xl:grid-cols-2">
                                <div>
                                    <Dato label="Estado de la solicitud" value={ESTADOS_SOLICITUD[servicio.estado]} />
                                    <Dato label="Tipo de emergencia" value={servicio.tipo_emergencia && TIPOS_EMERGENCIA[servicio.tipo_emergencia]} />
                                    <Dato label="Prioridad" value={PRIORIDADES_EMERGENCIA[servicio.prioridad]} />
                                </div>
                                <div>
                                    <Dato label="Origen" value={servicio.direccion_origen} />
                                    <Dato label="Ubicación actual" value={a?.ubicacion_actual ?? null} />
                                    <Dato label="Despacho" value={servicio.fecha_despacho && fechaHoraLegible(servicio.fecha_despacho)} />
                                </div>
                            </dl>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Mantenimiento" />
                    <CardContent className="pt-2">
                        <p className="text-sm text-muted-foreground">
                            Poner la unidad fuera de servicio para revisión. Mientras esté En Mantenimiento, los pacientes ven «No
                            disponible» y recepción no puede despachar.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                disabled={!puedeCambiarEstado || a?.estado !== 'disponible'}
                                onClick={() => mantenimiento.mutate('en_mantenimiento')}
                            >
                                <Pause /> Poner en mantenimiento
                            </Button>
                            <Button
                                variant="outline"
                                disabled={!puedeCambiarEstado || a?.estado !== 'en_mantenimiento'}
                                onClick={() => mantenimiento.mutate('disponible')}
                            >
                                <Play /> Quitar mantenimiento
                            </Button>
                        </div>
                        {mantenimiento.isPending && <p role="status" className="mt-3 text-sm">Actualizando estado…</p>}
                        {mantenimiento.isError && (
                            <Alert tone="danger" title="No se pudo cambiar el estado" className="mt-3">
                                {mantenimiento.error instanceof ApiError ? mantenimiento.error.message : 'Intenta de nuevo.'}
                            </Alert>
                        )}
                        {a?.estado === 'en_servicio' && (
                            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="size-3.5" aria-hidden />
                                El mantenimiento se habilita al terminar el servicio.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Solicitudes pendientes" />
                    <CardContent className="pt-3">
                        {solicitudes.status === 'empty' && solicitudes.data?.total === 0 ? (
                            <p className="flex items-center gap-3 text-sm">
                                <Check className="size-5 text-success-ink" aria-hidden />
                                Ninguna en espera.
                            </p>
                        ) : (
                            <ResourceView
                                resource={solicitudes.status === 'empty' && pagina > ultimaPagina
                                    ? { ...solicitudes, status: 'loading' } : solicitudes}
                                empty={{ title: 'No hay solicitudes en esta página', action: (
                                    <Button variant="outline" onClick={() => { setPagina(1); solicitudes.refetch(); }}>Volver al inicio de la cola</Button>
                                ) }}
                            >
                                {({ items, total }) => (
                                    <>
                                        <ul className="divide-y divide-border">
                                            {items.map((s) => (
                                                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                                    <span className="font-semibold">{s.tipo_emergencia ? TIPOS_EMERGENCIA[s.tipo_emergencia] : 'Sin clasificar'}</span>
                                                    <span className="text-muted-foreground">
                                                        {s.direccion_origen ?? '—'} · {fechaHoraLegible(s.fecha_solicitud)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        {total > PAGE_SIZE && (
                                            <Pagination page={pagina} pageSize={PAGE_SIZE} total={total} onPageChange={setPagina} />
                                        )}
                                    </>
                                )}
                            </ResourceView>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
