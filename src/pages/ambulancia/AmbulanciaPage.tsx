import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, Check, ClipboardList, Info, Pause, Play } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { ResourceView } from '@/components/ResourceView';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/feedback-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { selectResource, useResource } from '@/hooks/useResource';
import { cn } from '@/lib/utils';
import { obtenerAmbulancia } from '@/services/admin.service';
import type { AmbulanciaEstado, EstadoAmbulancia } from '@/types/admin.types';

const ICONO_ESTADO: Record<EstadoAmbulancia, string> = {
    disponible: 'bg-success-soft text-success-ink',
    en_servicio: 'bg-danger-soft text-danger',
    en_mantenimiento: 'bg-neutral-soft text-neutral-ink',
};

function Dato({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 2xl:last:border-b-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-right text-sm font-semibold">{value}</dd>
        </div>
    );
}

// WEB-9 Ambulancia: estado en tiempo real de la única unidad y mantenimiento (solo Administrador).
export default function AmbulanciaPage() {
    const recurso = useResource(obtenerAmbulancia);
    // Estado local para previsualizar el cambio a mantenimiento hasta conectar la API.
    const [estado, setEstado] = useState<AmbulanciaEstado | undefined>();
    useEffect(() => setEstado(recurso.data), [recurso.data]);

    const a = estado;
    const servicio = selectResource(recurso, () => a?.servicio ?? null, (v) => v === null);
    const solicitudes = selectResource(recurso, () => a?.solicitudesPendientes ?? [], (v) => v.length === 0);

    const cambiarMantenimiento = (activar: boolean) =>
        setEstado((s) => s && { ...s, estado: activar ? 'en_mantenimiento' : 'disponible', desde: 'ahora', servicio: null });

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

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-4">
                <Card>
                    <CardHeader title="Estado actual de la única unidad" />
                    <CardContent className="pt-4">
                        {recurso.status === 'loading' && (
                            <div className="flex items-center gap-4" aria-hidden>
                                <Skeleton className="size-16 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-7 w-32 rounded-full" />
                                    <Skeleton className="h-3 w-44" />
                                </div>
                            </div>
                        )}
                        {recurso.status === 'error' && <ErrorState compact onRetry={recurso.refetch} />}
                        {a && recurso.status !== 'loading' && recurso.status !== 'error' && (
                            <div className="flex items-center gap-4">
                                <span className={cn('flex size-16 items-center justify-center rounded-xl', ICONO_ESTADO[a.estado])}>
                                    <Ambulance className="size-8" aria-hidden />
                                </span>
                                <div>
                                    <StatusBadge estado={a.estado} size="lg" />
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Desde {a.desde === 'ahora' ? 'ahora' : `las ${a.desde}`} · actualizado en vivo
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Servicio actual" />
                    <CardContent className="pt-3">
                        <ResourceView
                            resource={servicio}
                            empty={{
                                icon: Ambulance,
                                title: 'Sin servicio en curso',
                                description: 'Cuando recepción despache la unidad, aquí verás paciente, ubicación y tiempos.',
                            }}
                        >
                            {(s) => (
                                <>
                                    <dl className="grid grid-cols-1 gap-x-8 2xl:grid-cols-2">
                                        <div>
                                            <Dato label="Paciente" value={s.paciente} />
                                            <Dato label="Ubicación" value={s.ubicacion} />
                                            <Dato label="Despachada por" value={s.despachadaPor} />
                                        </div>
                                        <div>
                                            <Dato label="Tipo de emergencia" value={s.tipoEmergencia} />
                                            <Dato label="Solicitada" value={s.solicitada} />
                                            <Dato label="Conductor de turno" value={s.conductor} />
                                        </div>
                                    </dl>
                                    <Alert className="mt-3">El cierre del servicio lo hace recepción en Android (AND-R13).</Alert>
                                </>
                            )}
                        </ResourceView>
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
                                disabled={a?.estado !== 'disponible' || recurso.status === 'error'}
                                onClick={() => cambiarMantenimiento(true)}
                            >
                                <Pause /> Poner En Mantenimiento
                            </Button>
                            <Button
                                variant="outline"
                                disabled={a?.estado !== 'en_mantenimiento' || recurso.status === 'error'}
                                onClick={() => cambiarMantenimiento(false)}
                            >
                                <Play /> Quitar mantenimiento
                            </Button>
                        </div>
                        {a?.estado === 'en_servicio' && (
                            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="size-3.5" aria-hidden />
                                Deshabilitado ahora: no se puede pasar a mantenimiento con un servicio En Servicio.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Solicitudes pendientes" />
                    <CardContent className="pt-3">
                        {solicitudes.status === 'empty' ? (
                            <p className="flex items-center gap-3 text-sm">
                                <Check className="size-5 text-success-ink" aria-hidden />
                                Ninguna en espera. Se despachan desde Android.
                            </p>
                        ) : (
                            <ResourceView resource={solicitudes}>
                                {(lista) => (
                                    <ul className="divide-y divide-border">
                                        {lista.map((s) => (
                                            <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                                                <span className="font-semibold">{s.tipo}</span>
                                                <span className="text-muted-foreground">
                                                    {s.origen} · {s.solicitada}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ResourceView>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
