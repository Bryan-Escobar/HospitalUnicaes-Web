// Modelos de vista del panel Web (Administrador). Cuando la API (HospitalUnicaes-Api) exponga
// los endpoints, los servicios mapearán los DTO del contrato OpenAPI a estos tipos.

export type EstadoLaboratorio = "pendiente" | "en_proceso" | "completado"
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

export interface Reportes {
  ocupacionHistorica: { dia: string; ocupadas: number }[]
  ambulanciaPorSemana: { semana: string; servicios: number }[]
  laboratorio: Record<EstadoLaboratorio, number>
  citasPorDoctor: { doctor: string; citas: number }[]
}
