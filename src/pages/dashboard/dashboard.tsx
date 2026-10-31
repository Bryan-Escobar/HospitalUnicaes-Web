import type * as React from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, CalendarDays, CalendarX2, ChevronRight, FlaskConical, Package, RefreshCw, Stethoscope, TriangleAlert } from 'lucide-react';

import { HorizontalBars } from '@/components/charts';
import { KpiCard } from '@/components/KpiCard';
import { PageHeader } from '@/components/layout/AdminLayout';
import { ResourceView } from '@/components/ResourceView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { selectResource, useResource, useSecondsSince } from '@/hooks/useResource';
import { cn } from '@/lib/utils';
import { obtenerResumenDashboard } from '@/services/dashboard.service';
import type { EstadoAmbulancia } from '@/types/admin.types';
import type { ConteoCamas, EstadoCita } from '@/types/dashboard.types';

// El resumen se vuelve a pedir en segundo plano para que el panel refleje lo que pasa en las apps móviles.
const REFRESCO_MS = 30_000;

const ORDEN_CITAS: EstadoCita[] = ['programada', 'confirmada', 'atendida', 'no_asistio', 'cancelada'];

const DETALLE_AMBULANCIA: Record<EstadoAmbulancia, string> = {
    disponible: 'Lista para despacho',
    en_servicio: 'Atendiendo una emergencia',
    en_mantenimiento: 'Fuera de servicio por mantenimiento',
};

const fechaLarga = new Intl.DateTimeFormat('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/El_Salvador',
});

const porcentaje = (c: ConteoCamas) => (c.total === 0 ? 0 : Math.round((c.ocupadas / c.total) * 100));

// WEB-2 Dashboard: estado del hospital de un vistazo, con datos de GET /api/dashboard/resumen.
export default function Dashboard() {
    const resumen = useResource(obtenerResumenDashboard, [], (r) => r == null, { refreshMs: REFRESCO_MS });
    const segundos = useSecondsSince(resumen.updatedAt);
    const d = resumen.data;
    const status = resumen.status === 'empty' ? 'success' : resumen.status;

    const personal = selectResource(resumen, (r) => r.personal_de_turno.por_tipo, (v) => v.length === 0);
    const citas = selectResource(resumen, (r) => r.citas_hoy, (v) => v.total === 0);
    const inventario = selectResource(resumen, (r) => ({ bajoMinimo: r.inventario_bajo_minimo, lotes: r.lotes_por_vencer }), () => false);
    const laboratorio = selectResource(resumen, (r) => r.laboratorio, (v) => v.pendientes + v.en_proceso === 0);

    const fecha = d ? fechaLarga.format(new Date(d.generado_en)) : '';

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle={
                    resumen.status === 'loading'
                        ? 'Cargando indicadores…'
                        : resumen.status === 'error'
                          ? 'No se pudo cargar el resumen del hospital'
                          : `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)} · actualizado hace ${segundos ?? 0} s`
                }
                actions={
                    <>
                        <Button variant="outline" onClick={resumen.refetch} disabled={resumen.status === 'loading'}>
                            <RefreshCw /> Actualizar
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
                    value={d?.ocupacion.total.ocupadas}
                    suffix={`/ ${d?.ocupacion.total.total} camas`}
                    footer={d && `${porcentaje(d.ocupacion.total)} % · ${d.ocupacion.total.disponibles} camas libres`}
                >
                    {d && <Progress value={d.ocupacion.total.ocupadas} max={d.ocupacion.total.total} label="Ocupación total" />}
                </KpiCard>
                <KpiCard
                    label="Planta 3 · VIP"
                    status={status}
                    value={d?.ocupacion.vip.ocupadas}
                    suffix={`/ ${d?.ocupacion.vip.total} ocupadas`}
                    footer={d && `VIP-301 a VIP-305 · ${d.ocupacion.vip.disponibles} libres`}
                >
                    {d && <Progress value={d.ocupacion.vip.ocupadas} max={d.ocupacion.vip.total} label="Ocupación VIP" />}
                </KpiCard>
                <KpiCard
                    label="Planta 2 · semiprivadas"
                    status={status}
                    value={d?.ocupacion.semiprivada.ocupadas}
                    suffix={`/ ${d?.ocupacion.semiprivada.total} camas`}
                    footer={d && `HAB-201 a HAB-206 · ${d.ocupacion.semiprivada.disponibles} libres`}
                >
                    {d && <Progress value={d.ocupacion.semiprivada.ocupadas} max={d.ocupacion.semiprivada.total} label="Ocupación semiprivadas" />}
                </KpiCard>
                <KpiCard
                    label="Ambulancia"
                    status={status}
                    footer={
                        d && (
                            <Link to="/ambulancia" className="hover:underline">
                                {DETALLE_AMBULANCIA[d.ambulancia.estado]}
                            </Link>
                        )
                    }
                >
                    {d && (
                        <div className="py-1">
                            <StatusBadge estado={d.ambulancia.estado} size="lg" />
                        </div>
                    )}
                </KpiCard>
                <KpiCard
                    label="Citas de hoy"
                    status={status}
                    value={d?.citas_hoy.total}
                    footer={d && `${cantidadCitas(d.citas_hoy.por_estado, 'atendida')} atendidas · ${pendientesDeAtender(d.citas_hoy.por_estado)} por atender`}
                />
                <KpiCard
                    label="Personal de turno ahora"
                    status={status}
                    value={d?.personal_de_turno.total}
                    footer={d && (d.personal_de_turno.total === 0 ? 'Nadie en turno en este momento' : `${d.personal_de_turno.por_tipo.length} tipos de personal`)}
                />
            </section>

            <section className="mt-4 grid grid-cols-2 gap-4 2xl:grid-cols-4">
                <Card className="min-h-[300px]">
                    <CardHeader title="Personal de turno ahora" description="Por tipo de personal" action={<VerMas to="/turnos">Ver turnos</VerMas>} />
                    <CardContent className="pt-5">
                        <ResourceView
                            resource={personal}
                            empty={{ title: 'Nadie de turno ahora', description: 'Asigna turnos desde la sección Turnos.', icon: Stethoscope }}
                        >
                            {(tipos) => <HorizontalBars data={tipos.map((t) => ({ label: t.tipo, value: t.cantidad }))} />}
                        </ResourceView>
                    </CardContent>
                </Card>

                <Card className="min-h-[300px]">
                    <CardHeader title="Citas del día" description={d && `${d.citas_hoy.total} en total`} />
                    <CardContent className="pt-4">
                        <ResourceView
                            resource={citas}
                            empty={{ title: 'Sin citas hoy', description: 'Las citas agendadas para hoy aparecerán aquí.', icon: CalendarX2 }}
                        >
                            {(c) => (
                                <ul className="divide-y divide-border">
                                    {ORDEN_CITAS.map((estado) => (
                                        <li key={estado} className="flex items-center justify-between py-2.5">
                                            <StatusBadge estado={estado} />
                                            <span className="text-base font-bold tabular">{cantidadCitas(c.por_estado, estado)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ResourceView>
                    </CardContent>
                </Card>

                <Card className="min-h-[300px]">
                    <CardHeader title="Inventario" description="Stock y caducidad de lotes" action={<VerMas to="/inventario">Ir al inventario</VerMas>} />
                    <CardContent className="pt-4">
                        <ResourceView resource={inventario}>
                            {(inv) => (
                                <ul className="space-y-2">
                                    <AlertaInventario
                                        to="/inventario?stock=bajo"
                                        icon={TriangleAlert}
                                        label="Ítems bajo el stock mínimo"
                                        valor={inv.bajoMinimo}
                                        tono="warning"
                                    />
                                    <AlertaInventario to="/inventario" icon={Package} label="Lotes vencidos" valor={inv.lotes.vencidos} tono="danger" />
                                    <AlertaInventario to="/inventario" icon={CalendarDays} label="Vencen en 15 días" valor={inv.lotes.en_15_dias} tono="warning" />
                                    <AlertaInventario to="/inventario" icon={CalendarDays} label="Vencen en 16 a 30 días" valor={inv.lotes.en_30_dias} tono="info" />
                                </ul>
                            )}
                        </ResourceView>
                    </CardContent>
                </Card>

                <Card className="min-h-[300px]">
                    <CardHeader title="Laboratorio" description="Órdenes sin completar" action={<VerMas to="/laboratorio">Ver órdenes</VerMas>} />
                    <CardContent className="pt-4">
                        <ResourceView
                            resource={laboratorio}
                            empty={{ title: 'Todo al día', description: 'No hay órdenes pendientes ni en proceso.', icon: FlaskConical }}
                        >
                            {(lab) => (
                                <ul className="divide-y divide-border">
                                    <li className="flex items-center justify-between py-2.5">
                                        <StatusBadge estado="pendiente" />
                                        <span className="text-base font-bold tabular">{lab.pendientes}</span>
                                    </li>
                                    <li className="flex items-center justify-between py-2.5">
                                        <StatusBadge estado="en_proceso" />
                                        <span className="text-base font-bold tabular">{lab.en_proceso}</span>
                                    </li>
                                </ul>
                            )}
                        </ResourceView>
                    </CardContent>
                </Card>
            </section>
        </>
    );
}

function cantidadCitas(porEstado: { estado: EstadoCita; cantidad: number }[], estado: EstadoCita) {
    return porEstado.find((x) => x.estado === estado)?.cantidad ?? 0;
}

function pendientesDeAtender(porEstado: { estado: EstadoCita; cantidad: number }[]) {
    return cantidadCitas(porEstado, 'programada') + cantidadCitas(porEstado, 'confirmada');
}

function VerMas({ to, children }: { to: string; children: React.ReactNode }) {
    return (
        <Link to={to} className="text-[13px] text-primary hover:underline">
            {children}
        </Link>
    );
}

const TONOS_ALERTA = {
    danger: 'border-danger/30 bg-danger-soft text-danger',
    warning: 'border-warning-border bg-warning-soft text-warning-ink',
    info: 'border-info-ink/25 bg-info-soft text-info-ink',
};

// Una fila de alerta de inventario: resaltada solo si hay algo que atender, siempre con acceso directo.
function AlertaInventario({
    to,
    icon: Icon,
    label,
    valor,
    tono,
}: {
    to: string;
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    label: string;
    valor: number;
    tono: keyof typeof TONOS_ALERTA;
}) {
    return (
        <li>
            <Link
                to={to}
                className={cn(
                    'flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-muted',
                    valor > 0 ? TONOS_ALERTA[tono] : 'border-border text-muted-foreground',
                )}
            >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">{label}</span>
                <span className="text-base font-bold tabular">{valor}</span>
                <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden />
            </Link>
        </li>
    );
}
