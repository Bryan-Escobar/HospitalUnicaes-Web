// Modelos de vista del panel Web (Administrador). Cuando la API (HospitalUnicaes-Api) exponga
// los endpoints, los servicios mapearán los DTO del contrato OpenAPI a estos tipos.

export const ESTADOS_LABORATORIO = ['pendiente', 'en_proceso', 'completado'] as const
export type EstadoLaboratorio = typeof ESTADOS_LABORATORIO[number]
export type EstadoAmbulancia = "disponible" | "en_servicio" | "en_mantenimiento"

export interface Paginado<T> {
  items: T[]
  total: number
}

export interface Paciente {
  id: string
  nombre: string
  documento: string
  telefono: string
  habitacion: string | null
  ultimaConsulta: string
  medico: string
}
