import { useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChartColumn, Download } from 'lucide-react';

import { ChartDataTable, HorizontalBars, LabStatusBars, LineChart } from '@/components/charts';
import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/feedback-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { estadoLabel } from '@/lib/estados';
import { fechaHospital, sumarDias } from '@/lib/fechas-hospital';
import { obtenerReportes } from '@/services/reportes.service';
import { ESTADOS_LABORATORIO } from '@/types/admin.types';
import { exportarReportes } from './exportar-reportes';

const formatoFecha = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeZone: 'UTC' });
const mostrarFecha = (fecha: string) => formatoFecha.format(new Date(`${fecha}T00:00:00Z`));

function ChartCard({
    title,
    description,
    chart,
    table,
    empty = false,
    className,
}: {
    title: string;
    description?: string;
    chart: ReactNode;
    table: ReactNode;
    empty?: boolean;
    className?: string;
}) {
    const [verDatos, setVerDatos] = useState(false);
    return (
        <Card className={className}>
            <CardHeader
                title={title}
                description={description}
                action={
                    !empty && (
                        <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`${verDatos ? 'Ver gráfica' : 'Ver datos'} de ${title}`}
                            onClick={() => setVerDatos(!verDatos)}
                        >
                            {verDatos ? 'Ver gráfica' : 'Ver datos'}
                        </Button>
                    )
                }
            />
            <CardContent className="pt-5">
                {empty ? <EmptyState icon={ChartColumn} title="Sin datos en el periodo" compact /> : verDatos ? table : chart}
            </CardContent>
        </Card>
    );
}

export default function ReportesPage() {
    const hoy = fechaHospital();
    const [rango, setRango] = useState(() => ({ desde: sumarDias(hoy, -29), hasta: hoy }));
    const [desde, setDesde] = useState(rango.desde);
    const [hasta, setHasta] = useState(rango.hasta);
    const [planta, setPlanta] = useState('');
    const [errorRango, setErrorRango] = useState('');
    const consulta = useQuery({
        queryKey: ['reportes', rango],
        queryFn: ({ signal }) => obtenerReportes(rango, signal),
        gcTime: 0,
    });

    const datos = consulta.data;
    const plantas = [...new Set(datos?.ocupacion.map((fila) => fila.planta))];
    const plantaVisible = plantas.some((numero) => String(numero) === planta) ? planta : '';
    const plantasVisibles = plantas.filter((numero) => !plantaVisible || String(numero) === plantaVisible);
    const ocupacion = (datos?.ocupacion ?? []).filter((fila) => !plantaVisible || String(fila.planta) === plantaVisible);
    const escalaOcupacion = Math.max(1, ...ocupacion.map((fila) => fila.ocupadas));

    function aplicarFiltros(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (desde > hasta || hasta > hoy || hasta > sumarDias(desde, 365)) {
            setErrorRango('Elige un rango de hasta 366 días, con la fecha inicial anterior o igual a la final y sin fechas futuras.');
            return;
        }
        setErrorRango('');
        if (rango.desde === desde && rango.hasta === hasta) void consulta.refetch();
        else setRango({ desde, hasta });
    }

    return (
        <>
            <PageHeader
                title="Reportes y métricas"
                subtitle="Indicadores del hospital por periodo"
                actions={
                    <Button
                        variant="outline"
                        disabled={!consulta.isSuccess || consulta.isFetching || desde !== rango.desde || hasta !== rango.hasta}
                        onClick={() => datos && exportarReportes(rango, { ...datos, ocupacion })}
                    >
                        <Download /> Exportar CSV
                    </Button>
                }
            />
            <form aria-label="Filtrar reportes por fecha" onSubmit={aplicarFiltros}>
                <Toolbar className="items-end">
                    <label className="grid gap-1.5 text-sm font-medium">
                        Desde
                        <Input type="date" value={desde} max={hoy} required onChange={(event) => setDesde(event.target.value)} />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                        Hasta
                        <Input type="date" value={hasta} max={hoy} required onChange={(event) => setHasta(event.target.value)} />
                    </label>
                    <Button type="submit">Aplicar fechas</Button>
                    {plantas.length > 0 && (
                        <label className="grid gap-1.5 text-sm font-medium">
                            Planta
                            <Select value={plantaVisible} onChange={(event) => setPlanta(event.target.value)}>
                                <option value="">Todas las plantas</option>
                                {plantas.map((numero) => <option key={numero} value={numero}>Planta {numero}</option>)}
                            </Select>
                        </label>
                    )}
                </Toolbar>
                {errorRango && <p role="alert" className="mb-4 text-sm text-danger">{errorRango}</p>}
            </form>
            <p className="mb-4 text-sm text-muted-foreground">
                {mostrarFecha(rango.desde)} – {mostrarFecha(rango.hasta)} · Hora de El Salvador
            </p>
            {consulta.isPending && (
                <div className="grid gap-4 xl:grid-cols-2" role="status">
                    <span className="sr-only">Cargando reportes…</span>
                    {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
                </div>
            )}
            {consulta.isError && (
                <ErrorState title="No se pudieron cargar los reportes" onRetry={consulta.refetch} />
            )}
            {datos && (
                <div className="grid items-start gap-4 xl:grid-cols-2">
                    <ChartCard
                        title="Ocupación diaria por planta"
                        className="min-w-0 xl:col-span-2"
                        description="Camas ocupadas al cierre de cada día. Para hoy se muestra el conteo al momento de la consulta."
                        empty={ocupacion.length === 0}
                        chart={
                            <div className="grid gap-5 lg:grid-cols-2">
                                {plantasVisibles.map((numero) => {
                                    const serie = ocupacion.filter((fila) => fila.planta === numero);
                                    return (
                                        <div key={numero} className="min-w-0 rounded-lg border border-border p-4">
                                            <h3 className="mb-4 text-sm font-semibold">Planta {numero}</h3>
                                            <LineChart
                                                label={`Camas ocupadas en planta ${numero}`}
                                                max={escalaOcupacion}
                                                capacityLabel={`${escalaOcupacion} camas`}
                                                data={serie.map((fila) => ({ label: mostrarFecha(fila.fecha), value: fila.ocupadas }))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        }
                        table={
                            <ChartDataTable
                                headers={['Planta y fecha', 'Camas ocupadas']}
                                rows={ocupacion.map((fila) => [`Planta ${fila.planta} · ${mostrarFecha(fila.fecha)}`, fila.ocupadas])}
                            />
                        }
                    />
                    <ChartCard
                        title="Citas atendidas por doctor"
                        description="Según la fecha agendada de cada cita."
                        empty={datos.citas.length === 0}
                        chart={
                            <div className="max-h-64 overflow-auto">
                                <HorizontalBars data={datos.citas.map((fila) => ({ id: fila.doctor_id, label: fila.doctor, value: fila.atendidas }))} />
                            </div>
                        }
                        table={<ChartDataTable headers={['Doctor', 'Citas atendidas']} rows={datos.citas.map((fila) => [fila.doctor, fila.atendidas])} />}
                    />
                    <ChartCard
                        title="Servicios de ambulancia por semana"
                        description="Servicios finalizados, agrupados por la semana en la que se cerraron."
                        empty={datos.ambulancia.length === 0}
                        chart={
                            <div className="max-h-64 overflow-auto">
                                <HorizontalBars data={datos.ambulancia.map((fila) => ({ label: `Semana del ${mostrarFecha(fila.semana)}`, value: fila.servicios }))} />
                            </div>
                        }
                        table={<ChartDataTable headers={['Inicio de semana', 'Servicios finalizados']} rows={datos.ambulancia.map((fila) => [mostrarFecha(fila.semana), fila.servicios])} />}
                    />
                    <ChartCard
                        title="Órdenes de laboratorio por estado"
                        description="Estado actual de las órdenes solicitadas en el periodo."
                        empty={Object.values(datos.laboratorio).every((cantidad) => cantidad === 0)}
                        chart={<LabStatusBars conteo={datos.laboratorio} layout="inline" />}
                        table={<ChartDataTable headers={['Estado', 'Órdenes']} rows={ESTADOS_LABORATORIO.map((estado) => [estadoLabel(estado), datos.laboratorio[estado]])} />}
                    />
                </div>
            )}
        </>
    );
}
