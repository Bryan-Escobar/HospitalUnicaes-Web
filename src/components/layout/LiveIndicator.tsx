import { useEffect, useState } from 'react';

import { useDemoStore } from '@/store/useDemoStore';
import { cn } from '@/lib/utils';

type Conexion = 'vivo' | 'reconectando' | 'sin_conexion';

function useConexion(): Conexion {
    const mode = useDemoStore((s) => s.mode);
    const [online, setOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);

    if (!online || mode === 'error') return 'sin_conexion';
    if (mode === 'carga') return 'reconectando';
    return 'vivo';
}

const ESTILOS: Record<Conexion, { label: string; box: string; dot: string }> = {
    vivo: { label: 'En vivo', box: 'bg-primary-soft border-primary-200 text-primary-ink', dot: 'bg-primary animate-pulse' },
    reconectando: { label: 'Reconectando…', box: 'bg-warning-soft border-warning-border text-warning-ink', dot: 'bg-chart-pendiente animate-pulse' },
    sin_conexion: { label: 'Sin conexión', box: 'bg-danger-soft border-danger/30 text-danger', dot: 'bg-danger' },
};

// Indicador de tiempo real: el estado se anuncia con texto, no solo con color.
export function LiveIndicator() {
    const conexion = useConexion();
    const { label, box, dot } = ESTILOS[conexion];
    return (
        <span role="status" aria-live="polite" className={cn('inline-flex h-7 items-center gap-2 rounded-full border px-3 text-xs font-semibold whitespace-nowrap', box)}>
            <span aria-hidden className={cn('size-2 rounded-full', dot)} />
            {label}
        </span>
    );
}
