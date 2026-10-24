import { Link } from 'react-router-dom';
import { BedDouble, CalendarDays, Stethoscope } from 'lucide-react';

import { LabStatusBars, ColumnChart } from '@/components/charts';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/layout/AdminLayout';
import { ResourceView } from '@/components/ResourceView';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { selectResource, useResource, useSecondsSince } from '@/hooks/useResource';
import { obtenerDashboard } from '@/services/admin.service';

// WEB-2 Dashboard: indicadores en tiempo real del hospital.
export default function Dashboard() {
    const resumen = useResource(obtenerDashboard);
    const segundos = useSecondsSince(resumen.updatedAt);
    const d = resumen.data;
    const status = resumen.status === 'empty' ? 'success' : resumen.status;

    const ocupacionDia = selectResource(resumen, (r) => r.ocupacionPorDia, (v) => v.length === 0);
    const laboratorio = selectResource(resumen, (r) => r.laboratorio, (v) => v.pendiente + v.en_proceso + v.completado === 0);
    const medicos = selectResource(resumen, (r) => r.medicosDeTurno, (v) => v.length === 0);

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle={
                    resumen.status === 'loading'
                        ? 'Cargando indicadores…'
                        : resumen.status === 'error'
                          ? 'No se pudo actualizar'
                          : `${d?.fecha} · actualizado hace ${segundos ?? 0} s`
                }
                actions={
                    <>
                        <Button variant="outline">
                            <CalendarDays /> Hoy
                        </Button>
                        <Button asChild>
                            <Link to="/mapa-plantas">
                                <BedDouble /> Ir al mapa de plantas
                            </Link>
                        </Button>
                    </>
                }
            />

            <section aria-label="Indicadores" className="grid grid-cols-3 gap-4 2xl:grid-cols-6">
                <KpiCard
                    label="Ocupación total"
                    status={status}
                    value={d?.ocupacion.ocupadas}
                    suffix={`/ ${d?.ocupacion.total} camas`}
                    footer={d && `${Math.round((d.ocupacion.ocupadas / d.ocupacion.total) * 100)} % · ${d.ocupacion.total - d.ocupacion.ocupadas} camas libres`}
                >
                    {d && <Progress value={d.ocupacion.ocupadas} max={d.ocupacion.total} label="Ocupación total" />}
                </KpiCard>
                <KpiCard
                    label="Planta 3 · VIP"
                    status={status}
                    value={d?.vip.ocupadas}
                    suffix={`/ ${d?.vip.total} ocupadas`}
                    footer={d && `VIP-301 a VIP-305 · ${d.vip.total - d.vip.ocupadas} libres`}
                >
                    {d && <Progress value={d.vip.ocupadas} max={d.vip.total} label="Ocupación VIP" />}
                </KpiCard>
                <KpiCard
                    label="Planta 2 · semiprivadas"
                    status={status}
                    value={d?.semiprivadas.ocupadas}
                    suffix={`/ ${d?.semiprivadas.total} camas`}
                    footer={d && `HAB-201 a HAB-206 · ${d.semiprivadas.total - d.semiprivadas.ocupadas} libres`}
                >
                    {d && <Progress value={d.semiprivadas.ocupadas} max={d.semiprivadas.total} label="Ocupación semiprivadas" />}
                </KpiCard>
                <KpiCard label="Ambulancia" status={status} footer={d?.ambulancia.detalle}>
                    {d && (
                        <div className="py-1">
                            <StatusBadge estado={d.ambulancia.estado} size="lg" />
                        </div>
                    )}
                </KpiCard>
                <KpiCard
                    label="Citas de hoy"
                    status={status}
                    value={d?.citasHoy.total}
                    footer={d && `${d.citasHoy.atendidas} atendidas · ${d.citasHoy.programadas} programadas · ${d.citasHoy.canceladas} cancelada${d.citasHoy.canceladas === 1 ? '' : 's'}`}
                />
                <KpiCard
                    label="Personal de turno"
                    status={status}
                    value={d?.personalDeTurno.total}
                    footer={d && `${d.personalDeTurno.doctores} doctores · ${d.personalDeTurno.enfermeria} enfermería · ${d.personalDeTurno.recepcion} recepción`}
                />
            </section>

            <section className="mt-4 grid grid-cols-2 gap-4 2xl:grid-cols-[4fr_3.4fr_3.6fr]">
                <Card className="col-span-2 min-h-[340px] 2xl:col-span-1 2xl:min-h-[600px]">
                    <CardHeader title="Ocupación por día" description="camas ocupadas de 17" />
                    <CardContent className="flex flex-1 flex-col pt-4">
                        <ResourceView
                            resource={ocupacionDia}
                            loading={
                                <div className="flex h-full min-h-56 items-end gap-3" aria-hidden>
                                    {[50, 60, 75, 65, 85, 75, 70].map((h, i) => (
                                        <Skeleton key={i} className="flex-1 rounded-t-[6px] rounded-b-none" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            }
                            empty={{ title: 'Sin datos de ocupación', description: 'Aún no hay registros de ocupación para esta semana.', icon: BedDouble }}
                        >
                            {(dias) => (
                                <ColumnChart
                                    label="Camas ocupadas por día, de 17"
                                    max={17}
                                    className="min-h-56"
                                    data={dias.map((x, i) => ({
                                        label: x.dia,
                                        value: x.ocupadas,
                                        highlight: i === dias.length - 1,
                                        valueLabel: i === dias.length - 1 ? `${x.ocupadas} hoy` : undefined,
                                    }))}
                                />
                            )}
                        </ResourceView>
                    </CardContent>
                </Card>

                <Card className="min-h-[340px] 2xl:min-h-[600px]">
                    <CardHeader
                        title="Laboratorio por estado"
                        action={
                            <Link to="/laboratorio" className="text-[13px] text-primary hover:underline">
                                Ver órdenes
                            </Link>
                        }
                    />
                    <CardContent className="flex flex-1 flex-col pt-5">
                        <div className="flex-1">
                            <ResourceView
                                resource={laboratorio}
                                empty={{ title: 'No hay órdenes hoy', description: 'Las órdenes creadas por los doctores aparecerán aquí.' }}
                            >
                                {(conteo) => <LabStatusBars conteo={conteo} />}
                            </ResourceView>
                        </div>
                        <p className="mt-6 text-xs text-muted-foreground">Órdenes de hoy · se actualiza al cambiar de estado</p>
                    </CardContent>
                </Card>

                <Card className="min-h-[340px] 2xl:min-h-[600px]">
                    <CardHeader
                        title="Médicos de turno ahora"
                        action={
                            <Link to="/turnos" className="text-[13px] text-primary hover:underline">
                                Ver turnos
                            </Link>
                        }
                    />
                    <CardContent className="pt-3">
                        <ResourceView
                            resource={medicos}
                            loading={
                                <div className="space-y-5 pt-2" aria-hidden>
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="size-9 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-3.5 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                            empty={{ title: 'Nadie de turno ahora', description: 'Asigna turnos desde la sección Turnos.', icon: Stethoscope }}
                        >
                            {(lista) => (
                                <ul className="divide-y divide-border">
                                    {lista.map((m) => (
                                        <li key={m.nombre} className="flex items-center gap-3 py-3">
                                            <Avatar name={m.nombre} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{m.nombre}</p>
                                                <p className="text-xs text-muted-foreground tabular">{m.horario}</p>
                                            </div>
                                            <Badge tone={m.tono}>{m.area}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ResourceView>
                    </CardContent>
                </Card>
            </section>
        </>
    );
}
