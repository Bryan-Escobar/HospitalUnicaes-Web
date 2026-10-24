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
// muestren siempre el estado correspondiente.
export function useResource<T>(
    fetcher: () => Promise<T>,
    deps: unknown[] = [],
    isEmpty: (data: T) => boolean = defaultIsEmpty,
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
        setState((s) => ({ ...s, status: 'loading', error: null }));
        fetcher()
            .then((data) => {
                if (!cancelled) {
                    setState({ status: isEmpty(data) ? 'empty' : 'success', data, error: null });
                    setUpdatedAt(Date.now());
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) setState({ status: 'error', data: undefined, error });
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, nonce, ...deps]);

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
