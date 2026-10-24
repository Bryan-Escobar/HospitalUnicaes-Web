import type * as React from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { cn } from '@/lib/utils';

// Estructura del panel: barra lateral (240 px) + barra superior + contenido con margen de 28 px.
export function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />
                <main className="flex-1 px-7 pt-6 pb-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export function PageHeader({
    title,
    subtitle,
    actions,
    className,
}: {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-4', className)}>
            <div className="min-w-0">
                <h1 className="text-display font-semibold tracking-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
    );
}

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn('mb-4 flex flex-wrap items-center gap-3', className)}>{children}</div>;
}
