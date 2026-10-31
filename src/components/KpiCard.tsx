import type * as React from 'react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ResourceStatus } from '@/hooks/useResource';
import { cn } from '@/lib/utils';

// Tarjeta de indicador: etiqueta, número KPI (30/36 · 700, tabular) y detalle.
export function KpiCard({
    label,
    status,
    value,
    suffix,
    children,
    footer,
    highlight,
    className,
}: {
    label: React.ReactNode;
    status: ResourceStatus;
    value?: React.ReactNode;
    suffix?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    highlight?: boolean;
    className?: string;
}) {
    return (
        <Card className={cn('min-h-[112px] gap-2 p-4', highlight && 'border-2 border-warning-border bg-warning-soft/40', className)}>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">{label}</p>
            {status === 'loading' ? (
                <div className="space-y-3 pt-1" aria-hidden>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-3 w-32" />
                </div>
            ) : status === 'error' ? (
                <p className="text-sm text-danger">
                    <span className="block text-[30px] leading-9 font-bold text-subtle-foreground">—</span>
                    Sin datos
                </p>
            ) : (
                <>
                    {value !== undefined && (
                        <p className="flex items-baseline gap-1.5">
                            <span className="text-[30px] leading-9 font-bold tabular">{value}</span>
                            {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
                        </p>
                    )}
                    {children}
                    {footer && <p className="text-xs leading-4 text-muted-foreground">{footer}</p>}
                </>
            )}
        </Card>
    );
}
