import { apiFetch } from '@/lib/api';
import type { EstadoLaboratorio } from '@/types/admin.types';

export interface RangoReportes {
    desde: string;
    hasta: string;
}

export interface Reportes {
    ocupacion: { planta: number; fecha: string; ocupadas: number }[];
    citas: { doctor_id: string; doctor: string; atendidas: number }[];
    ambulancia: { semana: string; servicios: number }[];
    laboratorio: Record<EstadoLaboratorio, number>;
}

export function obtenerReportes({ desde, hasta }: RangoReportes, signal: AbortSignal) {
    return apiFetch<Reportes>(`/dashboard/reportes?${new URLSearchParams({ desde, hasta })}`, { signal });
}
