import type * as React from 'react';

import { EmptyState, ErrorState } from '@/components/ui/feedback-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { Resource } from '@/hooks/useResource';
import type { LucideIcon } from 'lucide-react';

// Muestra el estado de un recurso dentro de un panel: esqueleto, error, vacío o el contenido.
export function ResourceView<T>({
    resource,
    children,
    loading,
    empty,
    compact = true,
}: {
    resource: Resource<T>;
    children: (data: NonNullable<T>) => React.ReactNode;
    loading?: React.ReactNode;
    empty?: { title: string; description?: React.ReactNode; action?: React.ReactNode; icon?: LucideIcon };
    compact?: boolean;
}) {
    switch (resource.status) {
        case 'loading':
            return (
                <>
                    {loading ?? (
                        <div className="space-y-3" aria-hidden>
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-3/5" />
                        </div>
                    )}
                    <span className="sr-only" role="status">
                        Cargando…
                    </span>
                </>
            );
        case 'error':
            return <ErrorState compact={compact} onRetry={resource.refetch} />;
        case 'empty':
            return <EmptyState compact={compact} {...empty} />;
        default:
            return <>{children(resource.data as NonNullable<T>)}</>;
    }
}
