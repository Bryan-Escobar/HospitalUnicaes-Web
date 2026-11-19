import { estadoLabel } from '@/lib/estados';
import type { RangoReportes, Reportes } from '@/services/reportes.service';
import { ESTADOS_LABORATORIO } from '@/types/admin.types';

export function exportarReportes(rango: RangoReportes, reportes: Reportes) {
    const filas = [
        ['Desde', 'Hasta', 'Métrica', 'Fecha', 'Planta', 'Doctor', 'Estado', 'Cantidad'],
        ...reportes.ocupacion.map((fila) => [rango.desde, rango.hasta, 'Camas ocupadas', fila.fecha, fila.planta, '', '', fila.ocupadas]),
        ...reportes.citas.map((fila) => [rango.desde, rango.hasta, 'Citas atendidas', '', '', fila.doctor, '', fila.atendidas]),
        ...reportes.ambulancia.map((fila) => [rango.desde, rango.hasta, 'Servicios finalizados', fila.semana, '', '', '', fila.servicios]),
        ...ESTADOS_LABORATORIO.map((estado) => [rango.desde, rango.hasta, 'Órdenes de laboratorio', '', '', '', estadoLabel(estado), reportes.laboratorio[estado]]),
    ];
    const csv = filas.map((fila) => fila.map((campo) => {
        // Las hojas de cálculo pueden interpretar texto ingresado por usuarios como una fórmula.
        const valor = typeof campo === 'string' ? campo.replace(/^(?=\s*[=+@-]|[\t\r\n])/, "'") : String(campo);
        return `"${valor.replaceAll('"', '""')}"`;
    }).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reportes-${rango.desde}-${rango.hasta}.csv`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
