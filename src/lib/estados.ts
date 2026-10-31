// Textos exactos de los estados del sistema de diseño (no cambiar sin actualizar Figma).
export const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    en_proceso: 'En Proceso',
    completado: 'Completado',
    disponible: 'Disponible',
    en_servicio: 'En Servicio',
    en_mantenimiento: 'En Mantenimiento',
    libre: 'Libre',
    ocupada: 'Ocupada',
    programada: 'Programada',
    confirmada: 'Confirmada',
    no_asistio: 'No asistió',
    atendida: 'Atendida',
    cancelada: 'Cancelada',
    finalizado: 'Finalizado',
    rechazada: 'Rechazada',
    no_disponible: 'No disponible',
    stock_bajo: 'Stock bajo',
    vigente: 'Vigente',
    programado: 'Programado',
    vencido: 'Vencido',
    activo: 'Activo',
    inactivo: 'Inactivo',
    en_curso: 'En curso',
} as const;

export type Estado = keyof typeof ESTADO_LABELS;

export function estadoLabel(estado: Estado) {
    return ESTADO_LABELS[estado];
}
