import { useCallback, useEffect, useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';

export type ResourceStatus = 'loading' | 'error' | 'empty' | 'success';

export interface Resource<T> {
    status: ResourceStatus;
    data: T | undefined;
    error: unknown;
    updatedAt: number | null;
    refetch: () => void;
}

function defaultIsEmpty(data: unknown) {
    if (Array.isArray(data)) return data.length === 0;
    if (data && typeof data === 'object' && 'items' in data) return (data as { items: unknown[] }).items.length === 0;
    return data == null;
}

// Carga un recurso y expone su estado (carga, error, vacío o con datos) para que tablas y paneles
// muestren siempre el estado correspondiente. Con `refreshMs` vuelve a pedir el recurso cada cierto
// tiempo sin pasar por el estado de carga; si una recarga falla se conservan los últimos datos.
export function useResource<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
    isEmpty: (data: T) => boolean = defaultIsEmpty,
    { refreshMs }: { refreshMs?: number } = {},
): Resource<T> {
    const mode = useDemoStore((s) => s.mode);
    const [nonce, setNonce] = useState(0);
    const [updatedAt, setUpdatedAt] = useState<number | null>(null);
    const [state, setState] = useState<{ status: ResourceStatus; data: T | undefined; error: unknown }>({
        status: 'loading',
        data: undefined,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;
        let ok = false;
        const cargar = (silencioso: boolean) =>
            fetcher()
                .then((data) => {
                    if (cancelled) return;
                    ok = true;
                    setState({ status: isEmpty(data) ? 'empty' : 'success', data, error: null });
                    setUpdatedAt(Date.now());
                })
                .catch((error: unknown) => {
                    if (!cancelled && !(silencioso && ok)) setState({ status: 'error', data: undefined, error });
                });

        setState((s) => ({ ...s, status: 'loading', error: null }));
        void cargar(false);
        const id = refreshMs ? setInterval(() => void cargar(true), refreshMs) : undefined;
        return () => {
            cancelled = true;
            clearInterval(id);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, nonce, refreshMs, ...deps]);

    const refetch = useCallback(() => setNonce((n) => n + 1), []);

    return { ...state, updatedAt, refetch };
}

// Deriva un sub-recurso (p. ej. un panel del dashboard) con su propio estado vacío.
export function selectResource<T, U>(resource: Resource<T>, pick: (data: T) => U, isEmpty: (value: U) => boolean): Resource<U> {
    if (resource.status === 'loading' || resource.status === 'error') {
        return { ...resource, data: undefined };
    }
    const data = pick(resource.data as T);
    return { ...resource, data, status: isEmpty(data) ? 'empty' : 'success' };
}

// Segundos transcurridos desde un instante, actualizados cada segundo («actualizado hace 2 s»).
export function useSecondsSince(since: number | null) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    return since === null ? null : Math.max(0, Math.round((now - since) / 1000));
}
