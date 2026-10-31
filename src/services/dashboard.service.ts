// Dashboard (WEB-2): llama a GET /api/dashboard/resumen, que agrega todo en la vista
// v_dashboard_summary. En modo demostración responde con datos de ejemplo del mismo contrato.
import { apiFetch } from '@/lib/api';
import { isDemoMode } from '@/lib/client';
import { responder } from '@/services/admin.service';
import type { ResumenDashboard } from '@/types/dashboard.types';

const conteo = (total: number, ocupadas: number) => ({ ocupadas, disponibles: total - ocupadas, total });

const demo = (): ResumenDashboard => ({
    ocupacion: { vip: conteo(5, 3), semiprivada: conteo(12, 9), total: conteo(17, 12) },
    personal_de_turno: {
        total: 9,
        por_tipo: [
            { tipo: 'Doctor', cantidad: 4 },
            { tipo: 'Enfermero/a', cantidad: 3 },
            { tipo: 'Recepcionista', cantidad: 2 },
        ],
    },
    ambulancia: { estado: 'en_servicio', solicitud_activa_id: '00000000-0000-0000-0000-000000000001' },
    citas_hoy: {
        total: 18,
        por_estado: [
            { estado: 'atendida', cantidad: 11 },
            { estado: 'confirmada', cantidad: 4 },
            { estado: 'programada', cantidad: 2 },
            { estado: 'cancelada', cantidad: 1 },
        ],
    },
    laboratorio: { pendientes: 7, en_proceso: 4 },
    inventario_bajo_minimo: 3,
    lotes_por_vencer: { vencidos: 1, en_15_dias: 2, en_30_dias: 4 },
    generado_en: new Date().toISOString(),
});

const vacio = (): ResumenDashboard => ({
    ocupacion: { vip: conteo(5, 0), semiprivada: conteo(12, 0), total: conteo(17, 0) },
    personal_de_turno: { total: 0, por_tipo: [] },
    ambulancia: { estado: 'disponible', solicitud_activa_id: null },
    citas_hoy: { total: 0, por_estado: [] },
    laboratorio: { pendientes: 0, en_proceso: 0 },
    inventario_bajo_minimo: 0,
    lotes_por_vencer: { vencidos: 0, en_15_dias: 0, en_30_dias: 0 },
    generado_en: new Date().toISOString(),
});

export function obtenerResumenDashboard(): Promise<ResumenDashboard> {
    if (isDemoMode) return responder(demo(), vacio());
    return apiFetch<ResumenDashboard>('/dashboard/resumen');
}
