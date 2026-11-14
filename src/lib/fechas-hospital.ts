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

// Valor de un <input type="datetime-local"> (AAAA-MM-DDTHH:mm) en hora del hospital.
export function fechaHoraHospital(instante: string | Date = new Date()): string {
    return formatoFechaHora.format(new Date(instante)).replace(' ', 'T');
}

// De un datetime-local en hora del hospital a ISO 8601 con su desfase, como lo pide la API.
export function instanteDesdeFechaHora(fechaHora: string): string {
    return `${fechaHora}:00-06:00`;
}

const formatoLegible = new Intl.DateTimeFormat('es-SV', {
    timeZone: zonaHospital,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

// «14 nov 2026, 8:00 a. m.», siempre en hora del hospital.
export function fechaHoraLegible(instante: string | Date): string {
    return formatoLegible.format(new Date(instante));
}

const formatoCorto = new Intl.DateTimeFormat('es-SV', {
    timeZone: zonaHospital,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
});

// «14 nov, 8:00 a. m.» (con el año solo si no es el actual), para tablas.
export function fechaHoraCorta(instante: string | Date, ahora = new Date()): string {
    const fecha = new Date(instante);
    const mismoAnio = formatoFecha.format(fecha).slice(0, 4) === formatoFecha.format(ahora).slice(0, 4);
    return mismoAnio ? formatoCorto.format(fecha) : formatoLegible.format(fecha);
}
