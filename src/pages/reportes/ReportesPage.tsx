import { useState } from 'react';
import type * as React from 'react';
import { ChartColumn, Download } from 'lucide-react';

import { ChartDataTable, ColumnChart, HorizontalBars, LabStatusBars, LineChart } from '@/components/charts';
import { PageHeader } from '@/components/layout/AdminLayout';
import { ResourceView } from '@/components/ResourceView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { estadoLabel } from '@/lib/estados';
import { selectResource, useResource, type Resource } from '@/hooks/useResource';
import { obtenerReportes } from '@/services/admin.service';
import type { EstadoLaboratorio } from '@/types/admin.types';

// Tarjeta de gráfica con alternancia «Ver datos» (tabla equivalente, accesible).
function ChartCard<T>({
    title,
    resource,
    chart,
    table,
}: {
    title: string;
    resource: Resource<T>;
    chart: (data: T) => React.ReactNode;
    table: (data: T) => React.ReactNode;
}) {
    const [verDatos, setVerDatos] = useState(false);
    return (
        <Card className="min-h-[320px] 2xl:min-h-[400px]">
            <CardHeader
                title={title}
                action={
                    resource.status === 'success' && (
                        <button
                            type="button"
                            className="text-[13px] text-primary hover:underline"
                            aria-pressed={verDatos}
                            onClick={() => setVerDatos((v) => !v)}
                        >
                            {verDatos ? 'Ver gráfica' : 'Ver datos'}
                        </button>
                    )
                }
            />
            <CardContent className="flex flex-1 flex-col pt-5">
                <ResourceView
                    resource={resource}
                    loading={<Skeleton className="h-full min-h-48 w-full rounded-lg" />}
                    empty={{ icon: ChartColumn, title: 'Sin datos en el periodo', description: 'Cambia el rango de fechas o la planta.' }}
                >
                    {(data) => (verDatos ? table(data) : chart(data))}
                </ResourceView>
            </CardContent>
        </Card>
    );
}

// WEB-12 Reportes y métricas: agregados (sin datos personales) para la toma de decisiones.
export default function ReportesPage() {
    const reportes = useResource(obtenerReportes);
    const ocupacion = selectResource(reportes, (r) => r.ocupacionHistorica, (v) => v.length === 0);
    const ambulancia = selectResource(reportes, (r) => r.ambulanciaPorSemana, (v) => v.length === 0);
    const laboratorio = selectResource(reportes, (r) => r.laboratorio, (v) => v.pendiente + v.en_proceso + v.completado === 0);
    const citas = selectResource(reportes, (r) => r.citasPorDoctor, (v) => v.length === 0);

    return (
        <>
            <PageHeader
                title="Reportes y métricas"
                subtitle="Datos agregados desde la API · cada gráfica tiene su tabla en «Ver datos»"
                actions={
                    <>
                        <Select aria-label="Periodo" defaultValue="30">
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="90">Últimos 90 días</option>
                        </Select>
                        <Select aria-label="Planta" defaultValue="ambas">
                            <option value="ambas">Planta: Ambas</option>
                            <option value="3">Planta 3 · VIP</option>
                            <option value="2">Planta 2 · semiprivadas</option>
                        </Select>
                        <Button variant="outline" disabled={reportes.status !== 'success'}>
                            <Download /> Exportar
                        </Button>
                    </>
                }
            />
            <div className="grid grid-cols-2 gap-4">
                <ChartCard
                    title="Ocupación histórica (camas ocupadas / 17)"
                    resource={ocupacion}
                    chart={(d) => (
                        <LineChart
                            label="Ocupación diaria de los últimos 30 días"
                            capacityLabel="Capacidad 17"
                            max={17}
                            data={d.map((x) => ({ label: x.dia, value: x.ocupadas }))}
                        />
                    )}
                    table={(d) => <ChartDataTable headers={['Día', 'Camas ocupadas']} rows={d.map((x) => [x.dia, x.ocupadas])} />}
                />
                <ChartCard
                    title="Servicios de ambulancia por semana"
                    resource={ambulancia}
                    chart={(d) => (
                        <ColumnChart
                            label="Servicios de ambulancia por semana"
                            className="min-h-56"
                            max={Math.max(...d.map((x) => x.servicios))}
                            data={d.map((x) => ({ label: x.semana, value: x.servicios, highlight: true }))}
                        />
                    )}
                    table={(d) => <ChartDataTable headers={['Semana', 'Servicios']} rows={d.map((x) => [x.semana, x.servicios])} />}
                />
                <ChartCard
                    title="Órdenes de laboratorio por estado"
                    resource={laboratorio}
                    chart={(d) => <LabStatusBars conteo={d} layout="inline" />}
                    table={(d) => (
                        <ChartDataTable
                            headers={['Estado', 'Órdenes']}
                            rows={(Object.keys(d) as EstadoLaboratorio[]).map((k) => [estadoLabel(k), d[k]])}
                        />
                    )}
                />
                <ChartCard
                    title="Citas por doctor"
                    resource={citas}
                    chart={(d) => <HorizontalBars data={d.map((x) => ({ label: x.doctor, value: x.citas }))} />}
                    table={(d) => <ChartDataTable headers={['Doctor', 'Citas']} rows={d.map((x) => [x.doctor, x.citas])} />}
                />
            </div>
        </>
    );
}
