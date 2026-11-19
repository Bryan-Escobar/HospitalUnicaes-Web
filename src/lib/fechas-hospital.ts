const zonaHospital = 'America/El_Salvador';
const formatoFecha = new Intl.DateTimeFormat('sv-SE', { timeZone: zonaHospital });

export function fechaHospital(ahora = new Date()): string {
    return formatoFecha.format(ahora);
}

// Se opera sobre fechas civiles en UTC para que el calendario no dependa de la zona del navegador.
export function sumarDias(fecha: string, dias: number): string {
    const dia = new Date(`${fecha}T00:00:00Z`);
    dia.setUTCDate(dia.getUTCDate() + dias);
    return dia.toISOString().slice(0, 10);
}

export function lunesDe(fecha: string): string {
    const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
    return sumarDias(fecha, -((dia + 6) % 7));
}

export function instanteHospital(fecha: string, hora = '00:00'): string {
    return `${fecha}T${hora}-06:00`;
}

const formatoFechaHora = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zonaHospital,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

// Fecha y hora civil (AAAA-MM-DDTHH:mm) en la zona del hospital.
export function fechaHoraHospital(instante: string | Date = new Date()): string {
    return formatoFechaHora.format(new Date(instante)).replace(' ', 'T');
}

// De una fecha y hora civil a ISO 8601 con el desfase del hospital.
export function instanteDesdeFechaHora(fechaHora: string): string {
    return `${fechaHora}:00-06:00`;
}

const formatoLegible = new Intl.DateTimeFormat('es-SV', { timeZone: zonaHospital, dateStyle: 'medium' });
const formatoNumerico = new Intl.DateTimeFormat('es-SV', { timeZone: zonaHospital, dateStyle: 'short' });
const formatoCorto = new Intl.DateTimeFormat('es-SV', {
    timeZone: zonaHospital,
    day: 'numeric',
    month: 'short',
});

export const patronHora12 = String.raw`(0?[1-9]|1[0-2]):([0-5][0-9])\s*([aApP])[mM]`;
const formatoHora12 = new RegExp(`^${patronHora12}$`);

export function horaLegible(valor: string): string {
    const [hora, minutos] = valor.split(':');
    const horas = Number(hora) % 24;
    return `${horas % 12 || 12}:${minutos} ${horas < 12 ? 'AM' : 'PM'}`;
}

export function horaEn24(valor: string): string {
    const partes = formatoHora12.exec(valor);
    if (!partes) return '';
    const [, hora, minutos, periodo] = partes;
    const horas = Number(hora) % 12 + (periodo.toUpperCase() === 'P' ? 12 : 0);
    return `${String(horas).padStart(2, '0')}:${minutos}`;
}

function mostrarFechaHora(fecha: Date, formato: Intl.DateTimeFormat): string {
    return `${formato.format(fecha)}, ${horaLegible(fechaHoraHospital(fecha).slice(11))}`;
}

export function fechaHoraLegible(instante: string | Date): string {
    return mostrarFechaHora(new Date(instante), formatoLegible);
}

export function fechaHoraNumerica(instante: string | Date): string {
    return mostrarFechaHora(new Date(instante), formatoNumerico);
}

// «14 nov, 8:00 AM» (con el año solo si no es el actual), para tablas.
export function fechaHoraCorta(instante: string | Date, ahora = new Date()): string {
    const fecha = new Date(instante);
    const mismoAnio = formatoFecha.format(fecha).slice(0, 4) === formatoFecha.format(ahora).slice(0, 4);
    return mostrarFechaHora(fecha, mismoAnio ? formatoCorto : formatoLegible);
}
