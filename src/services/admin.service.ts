import { useDemoStore } from '@/store/useDemoStore';

const LATENCIA_MS = 450;

// Respeta el modo de vista previa (?estado=carga|vacio|error) para revisar todos los estados.
export function responder<T>(data: T, vacio: T): Promise<T> {
    const { mode } = useDemoStore.getState();
    if (mode === 'carga') return new Promise(() => {});
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mode === 'error') reject(new Error('No se pudo conectar con el servidor.'));
            else resolve(mode === 'vacio' ? vacio : data);
        }, LATENCIA_MS);
    });
}

export const PAGE_SIZE = 10;
