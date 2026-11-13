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
