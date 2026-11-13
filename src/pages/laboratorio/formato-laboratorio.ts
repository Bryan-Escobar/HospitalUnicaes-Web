import type { PersonaLaboratorio } from '@/types/laboratorio.types';

const formato = new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/El_Salvador',
});

export function fechaHoraLaboratorio(fecha: string) {
    return formato.format(new Date(fecha));
}

export function nombreCompleto(persona: PersonaLaboratorio) {
    return `${persona.nombres} ${persona.apellidos}`;
}
