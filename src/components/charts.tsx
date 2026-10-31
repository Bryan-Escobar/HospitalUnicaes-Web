import type * as React from 'react';

import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import type { EstadoLaboratorio } from '@/types/admin.types';
import { cn } from '@/lib/utils';

// Gráficas ligeras (CSS/SVG) con los colores del sistema de diseño. Cada una tiene un texto
// accesible y, en Reportes, una tabla equivalente en «Ver datos».

export function ColumnChart({
    data,
    max,
    label,
    className,
}: {
    data: { label: string; value: number; valueLabel?: string; highlight?: boolean }[];
    max: number;
    label: string;
    className?: string;
}) {
    return (
        <figure className={cn('flex h-full min-h-0 flex-col', className)}>
            <figcaption className="sr-only">
                {label}: {data.map((d) => `${d.label} ${d.value}`).join(', ')}
            </figcaption>
            <div className="flex min-h-0 flex-1 items-end gap-3 border-b border-border" aria-hidden>
                {data.map((d) => (
                    <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className={cn('text-xs font-semibold tabular', d.highlight ? 'text-primary' : 'text-foreground')}>
                            {d.valueLabel ?? d.value}
                        </span>
                        <div
                            className={cn('w-full rounded-t-[6px] transition-[height] duration-500', d.highlight ? 'bg-primary' : 'bg-primary-200')}
                            style={{ height: `${max > 0 ? (d.value / max) * 85 : 0}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex gap-3 pt-2" aria-hidden>
                {data.map((d) => (
                    <span key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
                        {d.label}
                    </span>
                ))}
            </div>
        </figure>
    );
}

const COLOR_LAB: Record<EstadoLaboratorio, string> = {
    pendiente: 'bg-chart-pendiente',
    en_proceso: 'bg-chart-proceso',
    completado: 'bg-chart-completado',
};

// Filas de estado de laboratorio: badge + barra + número.
export function LabStatusBars({ conteo, layout = 'stacked' }: { conteo: Record<EstadoLaboratorio, number>; layout?: 'stacked' | 'inline' }) {
    const total = conteo.pendiente + conteo.en_proceso + conteo.completado;
    const estados: EstadoLaboratorio[] = ['pendiente', 'en_proceso', 'completado'];
    if (layout === 'inline') {
        return (
            <ul className="space-y-5">
                {estados.map((e) => (
                    <li key={e} className="grid grid-cols-[112px_1fr_48px] items-center gap-4">
                        <span>
                            <StatusBadge estado={e} />
                        </span>
                        <Progress value={conteo[e]} max={total} barClassName={COLOR_LAB[e]} className="h-3" />
                        <span className="text-right text-base font-bold tabular">{conteo[e]}</span>
                    </li>
                ))}
            </ul>
        );
    }
    return (
        <ul className="space-y-6">
            {estados.map((e) => (
                <li key={e}>
                    <div className="mb-2 flex items-center justify-between">
                        <StatusBadge estado={e} />
                        <span className="text-lg font-bold tabular">{conteo[e]}</span>
                    </div>
                    <Progress value={conteo[e]} max={total} barClassName={COLOR_LAB[e]} />
                </li>
            ))}
        </ul>
    );
}

export function HorizontalBars({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <ul className="space-y-5">
            {data.map((d) => (
                <li key={d.label} className="grid grid-cols-[minmax(140px,180px)_1fr_40px] items-center gap-4">
                    <span className="truncate text-sm">{d.label}</span>
                    <Progress value={d.value} max={max} className="h-3" label={d.label} />
                    <span className="text-right text-base font-bold tabular">{d.value}</span>
                </li>
            ))}
        </ul>
    );
}

export function LineChart({
    data,
    max,
    capacityLabel,
    label,
}: {
    data: { label: string; value: number }[];
    max: number;
    capacityLabel?: string;
    label: string;
}) {
    const W = 600;
    const H = 220;
    const pad = 12;
    const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, data.length - 1);
    const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
    const avg = data.reduce((s, d) => s + d.value, 0) / Math.max(1, data.length);
    const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');

    return (
        <figure className="w-full">
            <figcaption className="sr-only">
                {label}. Promedio {avg.toFixed(1)} de {max}.
            </figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden>
                <line x1={pad} x2={W - pad} y1={y(max)} y2={y(max)} stroke="var(--border-strong)" strokeDasharray="5 4" />
                {capacityLabel && (
                    <text x={pad} y={y(max) - 6} fontSize="11" fill="var(--fg-secondary)">
                        {capacityLabel}
                    </text>
                )}
                <line x1={pad} x2={W - pad} y1={y(avg)} y2={y(avg)} stroke="var(--primary-200)" strokeWidth="1.5" />
                <text x={W - pad} y={y(avg) - 6} fontSize="11" textAnchor="end" fill="var(--primary)">
                    Promedio {avg.toFixed(1).replace('.', ',')}
                </text>
                <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {data.map((d, i) => (
                    <circle key={d.label} cx={x(i)} cy={y(d.value)} r="2.5" fill="var(--primary)">
                        <title>
                            {d.label}: {d.value}
                        </title>
                    </circle>
                ))}
            </svg>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden>
                <span>{data[0]?.label}</span>
                <span>{data[data.length - 1]?.label}</span>
            </div>
        </figure>
    );
}

// Tabla equivalente a una gráfica («Ver datos»)
export function ChartDataTable({ headers, rows }: { headers: [string, string]; rows: [React.ReactNode, React.ReactNode][] }) {
    return (
        <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-muted">
                    <tr>
                        {headers.map((h) => (
                            <th key={h} scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([a, b], i) => (
                        <tr key={i} className="border-t border-border">
                            <td className="px-3 py-1.5">{a}</td>
                            <td className="px-3 py-1.5 tabular">{b}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
