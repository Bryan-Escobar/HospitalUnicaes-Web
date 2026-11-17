// Capa de datos del panel Web. Hoy responde con datos de ejemplo (mock-data.ts) y simula la
// latencia de red; cada función se reemplaza por la llamada a HospitalUnicaes-Api (VITE_API_URL)
// sin tocar las pantallas.
import { useDemoStore } from '@/store/useDemoStore';
import type {
    PerfilAdmin,
    Reportes,
} from '@/types/admin.types';
import * as db from './mock-data';

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

export function obtenerReportes(): Promise<Reportes> {
    return responder(db.reportes, {
        ocupacionHistorica: [],
        ambulanciaPorSemana: [],
        laboratorio: { pendiente: 0, en_proceso: 0, completado: 0 },
        citasPorDoctor: [],
    });
}

export function obtenerPerfil(): Promise<PerfilAdmin> {
    return responder(db.perfil, db.perfil);
}

export const perfilActual = db.perfil;
