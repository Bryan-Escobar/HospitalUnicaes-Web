// Modelos de vista del panel Web (Administrador). Cuando la API (HospitalUnicaes-Api) exponga
// los endpoints, los servicios mapearán los DTO del contrato OpenAPI a estos tipos.

export type EstadoLaboratorio = "pendiente" | "en_proceso" | "completado"
export type EstadoAmbulancia = "disponible" | "en_servicio" | "en_mantenimiento"
export type EstadoAviso = "vigente" | "programado" | "vencido"
export type ResultadoServicio = "finalizado" | "rechazada" | "en_mantenimiento" | "no_disponible"

export interface Paginado<T> {
  items: T[]
  total: number
}

export interface DashboardResumen {
  fecha: string
  ocupacion: { ocupadas: number; total: number }
  vip: { ocupadas: number; total: number }
  semiprivadas: { ocupadas: number; total: number }
  ambulancia: { estado: EstadoAmbulancia; detalle: string }
  citasHoy: { total: number; atendidas: number; programadas: number; canceladas: number }
  personalDeTurno: { total: number; doctores: number; enfermeria: number; recepcion: number }
  ocupacionPorDia: { dia: string; ocupadas: number }[]
  laboratorio: Record<EstadoLaboratorio, number>
  medicosDeTurno: MedicoDeTurno[]
}

export interface MedicoDeTurno {
  nombre: string
  horario: string
  area: string
  tono: "primary" | "danger"
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

export interface Turno {
  horario: string
  area?: string
  solapa?: boolean
}

export interface FilaTurnos {
  id: string
  nombre: string
  tipo: string
  // Lunes a domingo
  dias: (Turno | null)[]
}

export interface SemanaTurnos {
  titulo: string
  dias: string[]
  filas: FilaTurnos[]
  conflicto: string | null
}

export interface Cama {
  cama: "A" | "B" | null
  paciente: string | null
}

export interface Habitacion {
  codigo: string
  camas: Cama[]
}

export interface Planta {
  numero: 2 | 3
  nombre: string
  habitaciones: Habitacion[]
}

export interface MapaPlantas {
  plantas: Planta[]
  ultimoCambio: string | null
}

export interface Recurso {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  minimo: number
  ubicacion: string
}

export interface InventarioResumen {
  registrados: number
  categorias: number
  ultimaActualizacion: string
  actualizadoPor: string
}

export interface OrdenLaboratorio {
  id: number
  examen: string
  paciente: string
  doctor: string
  creada: string
  estado: EstadoLaboratorio
  resultado: { pdf: boolean; texto: boolean } | null
}

export interface AmbulanciaEstado {
  estado: EstadoAmbulancia
  desde: string
  servicio: {
    paciente: string
    ubicacion: string
    despachadaPor: string
    tipoEmergencia: string
    solicitada: string
    conductor: string
  } | null
  solicitudesPendientes: { id: string; tipo: string; solicitada: string; origen: string }[]
}

export interface ServicioBitacora {
  id: string
  fecha: string
  inicioFin: string
  tipo: string
  paciente: string | null
  despacho: string
  duracion: string | null
  resultado: ResultadoServicio
}

export interface Aviso {
  id: string
  titulo: string
  publico: boolean
  vigencia: string
  estado: EstadoAviso
}

export interface Reportes {
  ocupacionHistorica: { dia: string; ocupadas: number }[]
  ambulanciaPorSemana: { semana: string; servicios: number }[]
  laboratorio: Record<EstadoLaboratorio, number>
  citasPorDoctor: { doctor: string; citas: number }[]
}

export interface PerfilAdmin {
  nombre: string
  cargo: string
  correo: string
  telefono: string
  passwordCambiada: string
  sesionesActivas: number
}
