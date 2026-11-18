import type { PersonaLaboratorio } from '@/types/laboratorio.types';

export { fechaHoraNumerica as fechaHoraLaboratorio } from '@/lib/fechas-hospital';

export function nombreCompleto(persona: PersonaLaboratorio) {
    return `${persona.nombres} ${persona.apellidos}`;
}
