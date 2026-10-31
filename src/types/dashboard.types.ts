// Contrato de GET /api/dashboard/resumen (dashboard.dto.ts en HospitalUnicaes-Api).
import type { EstadoAmbulancia } from '@/types/admin.types';

export type EstadoCita = 'programada' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';

export interface ConteoCamas {
    ocupadas: number;
    disponibles: number;
    total: number;
}

export interface ResumenDashboard {
    ocupacion: { vip: ConteoCamas; semiprivada: ConteoCamas; total: ConteoCamas };
    personal_de_turno: { total: number; por_tipo: { tipo: string; cantidad: number }[] };
    ambulancia: { estado: EstadoAmbulancia; solicitud_activa_id: string | null };
    citas_hoy: { total: number; por_estado: { estado: EstadoCita; cantidad: number }[] };
    laboratorio: { pendientes: number; en_proceso: number };
    // Ítems activos con stock_actual < stock_minimo (HUNI-97).
    inventario_bajo_minimo: number;
    // Lotes con existencias: ya vencidos, que vencen en 0–15 días y en 16–30 días (HUNI-97).
    lotes_por_vencer: { vencidos: number; en_15_dias: number; en_30_dias: number };
    generado_en: string;
}
