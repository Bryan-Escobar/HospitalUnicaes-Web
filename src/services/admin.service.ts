// Capa de datos del panel Web. Hoy responde con datos de ejemplo (mock-data.ts) y simula la
// latencia de red; cada función se reemplaza por la llamada a HospitalUnicaes-Api (VITE_API_URL)
// sin tocar las pantallas.
import { useDemoStore } from '@/store/useDemoStore';
import type {
    AmbulanciaEstado,
    Aviso,
    DashboardResumen,
    EstadoAviso,
    EstadoLaboratorio,
    InventarioResumen,
    MapaPlantas,
    OrdenLaboratorio,
    Paciente,
    Paginado,
    PerfilAdmin,
    Recurso,
    Reportes,
    ResultadoServicio,
    SemanaTurnos,
    ServicioBitacora,
} from '@/types/admin.types';
import * as db from './mock-data';

const LATENCIA_MS = 450;

// Respeta el modo de vista previa (?estado=carga|vacio|error) para revisar todos los estados.
export function responder<T>(data: T, vacio: T): Promise<T> {
    const { mode } = useDemoStore.getState();
    if (mode === 'carga') return new Promise(() => {});
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (mode === 'error') reject(new Error('No se pudo conectar con el servidor.'));
            else resolve(mode === 'vacio' ? vacio : data);
        }, LATENCIA_MS);
    });
}

function normalizar(texto: string) {
    return texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

function contiene(campos: (string | null)[], busqueda: string) {
    const q = normalizar(busqueda.trim());
    return !q || campos.some((c) => c && normalizar(c).includes(q));
}

function paginar<T>(items: T[], page: number, pageSize: number): Paginado<T> {
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length };
}

const vacioPaginado = { items: [], total: 0 };

export const PAGE_SIZE = 10;

export function obtenerDashboard(): Promise<DashboardResumen> {
    return responder(db.dashboard, {
        ...db.dashboard,
        ocupacion: { ocupadas: 0, total: 17 },
        vip: { ocupadas: 0, total: 5 },
        semiprivadas: { ocupadas: 0, total: 12 },
        ambulancia: { estado: 'disponible', detalle: 'Sin servicios hoy' },
        citasHoy: { total: 0, atendidas: 0, programadas: 0, canceladas: 0 },
        personalDeTurno: { total: 0, doctores: 0, enfermeria: 0, recepcion: 0 },
        ocupacionPorDia: [],
        laboratorio: { pendiente: 0, en_proceso: 0, completado: 0 },
        medicosDeTurno: [],
    });
}

export interface FiltroPacientes {
    busqueda: string;
    hospitalizacion: 'todos' | 'hospitalizados' | 'ambulatorios';
    medico: string;
    page: number;
}

export function listarPacientes(f: FiltroPacientes): Promise<Paginado<Paciente>> {
    const items = db.pacientes.filter(
        (p) =>
            contiene([p.nombre, p.documento], f.busqueda) &&
            (f.hospitalizacion === 'todos' || (p.habitacion !== null) === (f.hospitalizacion === 'hospitalizados')) &&
            (f.medico === 'todos' || p.medico === f.medico),
    );
    return responder(paginar(items, f.page, PAGE_SIZE), vacioPaginado);
}

export function resumenPacientes() {
    return { total: db.pacientes.length, hospitalizados: db.pacientes.filter((p) => p.habitacion).length };
}

export function medicosTratantes() {
    return [...new Set(db.pacientes.map((p) => p.medico))].sort();
}

export function obtenerTurnos(): Promise<SemanaTurnos> {
    return responder(db.turnos, { ...db.turnos, filas: [], conflicto: null });
}

export function obtenerMapa(): Promise<MapaPlantas> {
    // El mapa nunca está «vacío»: las 11 habitaciones son datos semilla. En modo vacío todas quedan libres.
    const libres: MapaPlantas = {
        ultimoCambio: null,
        plantas: db.mapa.plantas.map((p) => ({
            ...p,
            habitaciones: p.habitaciones.map((h) => ({ ...h, camas: h.camas.map((c) => ({ ...c, paciente: null })) })),
        })),
    };
    return responder(db.mapa, libres);
}

export interface FiltroInventario {
    busqueda: string;
    categoria: string;
    ubicacion: string;
    soloStockBajo: boolean;
    page: number;
}

export function listarRecursos(f: FiltroInventario): Promise<Paginado<Recurso>> {
    const items = db.recursos.filter(
        (r) =>
            contiene([r.nombre], f.busqueda) &&
            (f.categoria === 'todas' || r.categoria === f.categoria) &&
            (f.ubicacion === 'todas' || r.ubicacion === f.ubicacion) &&
            (!f.soloStockBajo || r.cantidad < r.minimo),
    );
    return responder(paginar(items, f.page, PAGE_SIZE - 1), vacioPaginado);
}

export function obtenerResumenInventario(): Promise<InventarioResumen & { stockBajo: number }> {
    const data = { ...db.inventarioResumen, stockBajo: db.recursos.filter((r) => r.cantidad < r.minimo).length };
    return responder(data, { ...data, registrados: 0, categorias: 0, stockBajo: 0 });
}

export function categoriasInventario() {
    return [...new Set(db.recursos.map((r) => r.categoria))].sort();
}

export function ubicacionesInventario() {
    return [...new Set(db.recursos.map((r) => r.ubicacion))].sort();
}

export interface FiltroLaboratorio {
    estado: EstadoLaboratorio | 'todas';
    doctor: string;
    page: number;
}

export function listarOrdenes(f: FiltroLaboratorio): Promise<Paginado<OrdenLaboratorio> & { conteo: Record<EstadoLaboratorio | 'todas', number> }> {
    const porDoctor = db.ordenes.filter((o) => f.doctor === 'todos' || o.doctor === f.doctor);
    const conteo = {
        todas: porDoctor.length,
        pendiente: porDoctor.filter((o) => o.estado === 'pendiente').length,
        en_proceso: porDoctor.filter((o) => o.estado === 'en_proceso').length,
        completado: porDoctor.filter((o) => o.estado === 'completado').length,
    };
    const items = porDoctor.filter((o) => f.estado === 'todas' || o.estado === f.estado);
    return responder(
        { ...paginar(items, f.page, PAGE_SIZE), conteo },
        { ...vacioPaginado, conteo: { todas: 0, pendiente: 0, en_proceso: 0, completado: 0 } },
    );
}

export function doctoresLaboratorio() {
    return [...new Set(db.ordenes.map((o) => o.doctor))].sort();
}

export function obtenerAmbulancia(): Promise<AmbulanciaEstado> {
    return responder(db.ambulancia, { estado: 'disponible', desde: '06:00', servicio: null, solicitudesPendientes: [] });
}

export interface FiltroBitacora {
    estado: ResultadoServicio | 'todos';
    tipo: string;
    despacho: string;
    page: number;
}

export function listarBitacora(f: FiltroBitacora): Promise<Paginado<ServicioBitacora>> {
    const items = db.bitacora.filter(
        (s) =>
            (f.estado === 'todos' || s.resultado === f.estado) &&
            (f.tipo === 'todos' || s.tipo === f.tipo) &&
            (f.despacho === 'todos' || s.despacho === f.despacho),
    );
    return responder(paginar(items, f.page, PAGE_SIZE), vacioPaginado);
}

export function opcionesBitacora() {
    return {
        tipos: [...new Set(db.bitacora.map((s) => s.tipo))].sort(),
        despachos: [...new Set(db.bitacora.map((s) => s.despacho))].sort(),
    };
}

export type FiltroAvisos = 'todos' | EstadoAviso | 'publicos' | 'internos';

export function listarAvisos(filtro: FiltroAvisos): Promise<Aviso[]> {
    const items = db.avisos.filter((a) => {
        if (filtro === 'todos') return true;
        if (filtro === 'publicos') return a.publico;
        if (filtro === 'internos') return !a.publico;
        return a.estado === filtro;
    });
    return responder(items, []);
}

export function obtenerReportes(): Promise<Reportes> {
    return responder(db.reportes, {
        ocupacionHistorica: [],
        ambulanciaPorSemana: [],
        laboratorio: { pendiente: 0, en_proceso: 0, completado: 0 },
        citasPorDoctor: [],
    });
}

export function obtenerPerfil(): Promise<PerfilAdmin> {
    return responder(db.perfil, db.perfil);
}

export const perfilActual = db.perfil;
