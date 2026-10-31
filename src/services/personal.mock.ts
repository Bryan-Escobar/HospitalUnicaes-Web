// Datos de ejemplo de personal para el modo demostración: el mismo catálogo y personal semilla de
// HospitalUnicaes-Api (supabase/seed.sql) más personal sintético para ver la paginación.
import { ApiError } from '@/lib/api';
import type {
    ActualizarPersonalBody,
    CrearPersonalBody,
    Especialidad,
    FiltroPersonal,
    PaginaPersonal,
    Personal,
    TipoPersonal,
} from '@/types/personal.types';

const tipo = (n: number, nombre: string, rol_sugerido: TipoPersonal['rol_sugerido'], es_medico = false): TipoPersonal => ({
    id: `00000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`,
    nombre,
    rol_sugerido,
    es_medico,
    activo: true,
});

export const tipos: TipoPersonal[] = [
    tipo(1, 'Doctor', 'doctor', true),
    tipo(2, 'Alergista', 'doctor', true),
    tipo(3, 'Médico de emergencia', 'doctor', true),
    tipo(4, 'Enfermero/a', 'recepcionista'),
    tipo(5, 'Asistente', 'recepcionista'),
    tipo(6, 'Recepcionista', 'recepcionista'),
    tipo(7, 'Administrativo', 'administrador'),
    tipo(8, 'Mantenimiento', null),
];

export const especialidades: Especialidad[] = [
    'Alergología',
    'Cardiología',
    'Cirugía general',
    'Ginecología',
    'Medicina de emergencia',
    'Medicina general',
    'Medicina interna',
    'Pediatría',
].map((nombre, i) => ({ id: `00000000-0000-4000-9000-0000000000${String(i + 1).padStart(2, '0')}`, nombre, descripcion: null }));

const tipoPorNombre = (nombre: string) => tipos.find((t) => t.nombre === nombre)!;
const espPorNombre = (nombre: string | null) => especialidades.find((e) => e.nombre === nombre) ?? null;

function slug(texto: string) {
    return texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(' ')[0];
}

let secuencia = 0;

function persona(
    nombres: string,
    apellidos: string,
    tipoNombre: string,
    especialidad: string | null,
    conCuenta: boolean,
    licencia: string | null = null,
    activo = true,
): Personal {
    secuencia += 1;
    const t = tipoPorNombre(tipoNombre);
    const e = espPorNombre(especialidad);
    return {
        id: `demo-${secuencia}`,
        perfil_id: conCuenta ? `perfil-${secuencia}` : null,
        nombres,
        apellidos,
        email: conCuenta ? `${slug(nombres)}.${slug(apellidos)}@hospital.edu` : null,
        telefono: null,
        rol: conCuenta ? t.rol_sugerido : null,
        tipo: { id: t.id, nombre: t.nombre },
        especialidad: e && { id: e.id, nombre: e.nombre },
        codigo_empleado: `EMP-${String(secuencia).padStart(4, '0')}`,
        num_licencia: licencia,
        fecha_contratacion: '2024-01-15',
        activo,
    };
}

let personal: Personal[] = [
    persona('Andrea', 'Méndez Ruiz', 'Administrativo', null, true),
    persona('Roberto', 'Castillo Peña', 'Doctor', 'Medicina interna', true, 'JVPM-10234'),
    persona('Lucía', 'Herrera Gómez', 'Recepcionista', null, true),
    persona('María', 'López Flores', 'Enfermero/a', null, false, 'JVPE-55821'),
    persona('Gabriela', 'Ortiz Lemus', 'Doctor', 'Pediatría', true, 'JVPM-11872'),
    persona('Fernando', 'Aguilar Soto', 'Médico de emergencia', 'Medicina de emergencia', true, 'JVPM-12950'),
    persona('José', 'Navarro Paz', 'Enfermero/a', null, false, 'JVPE-60117'),
    persona('Patricia', 'Villalta Ríos', 'Alergista', 'Alergología', false, 'JVPM-13304'),
    persona('Óscar', 'Mejía Lara', 'Asistente', null, false, null, false),
    persona('Daniel', 'Castro Rivera', 'Doctor', 'Medicina general', true, 'JVPM-14001'),
    persona('Valeria', 'Portillo Campos', 'Enfermero/a', null, true, 'JVPE-61220'),
    persona('Ricardo', 'Alvarado Mejía', 'Recepcionista', null, true),
    persona('Claudia', 'Guevara Romero', 'Doctor', 'Cardiología', true, 'JVPM-14520'),
    persona('Emilio', 'Orellana Flores', 'Asistente', null, true),
    persona('Natalia', 'Menjívar Escobar', 'Enfermero/a', null, true, 'JVPE-61987', false),
    persona('Héctor', 'Quintanilla Aguilar', 'Mantenimiento', null, false),
    persona('Silvia', 'Hernández Martínez', 'Doctor', 'Ginecología', true, 'JVPM-15011'),
    persona('Mauricio', 'Rivera Castro', 'Médico de emergencia', 'Medicina de emergencia', true, 'JVPM-15302'),
    persona('Beatriz', 'Campos Orellana', 'Recepcionista', null, true),
    persona('Rodrigo', 'Escobar Guevara', 'Mantenimiento', null, false),
    persona('Lorena', 'Martínez Portillo', 'Enfermero/a', null, true, 'JVPE-62340'),
    persona('Samuel', 'Flores Alvarado', 'Doctor', 'Cirugía general', true, 'JVPM-15890'),
];

function normalizar(texto: string) {
    return texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

export function listar(f: FiltroPersonal, porPagina: number): PaginaPersonal {
    const q = normalizar(f.busqueda.trim());
    const items = personal
        .filter(
            (p) =>
                (q.length < 2 || [p.nombres, p.apellidos, p.codigo_empleado].some((c) => normalizar(c).includes(q))) &&
                (f.tipo === 'todos' || p.tipo.id === f.tipo) &&
                (f.estado === 'todos' || p.activo === (f.estado === 'activos')),
        )
        .sort((a, b) => a.apellidos.localeCompare(b.apellidos) || a.nombres.localeCompare(b.nombres));
    return {
        items: items.slice((f.page - 1) * porPagina, f.page * porPagina),
        paginacion: { pagina: f.page, por_pagina: porPagina, total: items.length, total_paginas: Math.ceil(items.length / porPagina) },
    };
}

function validarCodigo(codigo: string, exceptoId?: string) {
    if (personal.some((p) => p.codigo_empleado === codigo && p.id !== exceptoId)) {
        throw new ApiError(409, 'REGISTRO_DUPLICADO', 'Ya existe un empleado con ese código');
    }
}

function referencias(body: { tipo_personal_id?: string; especialidad_id?: string | null }) {
    const t = body.tipo_personal_id ? tipos.find((x) => x.id === body.tipo_personal_id) : undefined;
    const e = body.especialidad_id ? especialidades.find((x) => x.id === body.especialidad_id) : null;
    return { t, e };
}

export function crear(body: CrearPersonalBody): Personal {
    validarCodigo(body.codigo_empleado);
    const { t, e } = referencias(body);
    if (!t) throw new ApiError(400, 'REFERENCIA_INVALIDA', 'El tipo de personal no existe o está inactivo');
    if (body.email && personal.some((p) => p.email?.toLowerCase() === body.email!.toLowerCase())) {
        throw new ApiError(409, 'EMAIL_EN_USO', 'Ya existe una cuenta con ese correo');
    }
    secuencia += 1;
    const nuevo: Personal = {
        id: `demo-${secuencia}`,
        perfil_id: body.email ? `perfil-${secuencia}` : null,
        nombres: body.nombres,
        apellidos: body.apellidos,
        email: body.email ?? null,
        telefono: body.telefono ?? null,
        rol: body.email ? (body.rol ?? t.rol_sugerido) : null,
        tipo: { id: t.id, nombre: t.nombre },
        especialidad: e ? { id: e.id, nombre: e.nombre } : null,
        codigo_empleado: body.codigo_empleado,
        num_licencia: body.num_licencia ?? null,
        fecha_contratacion: body.fecha_contratacion ?? null,
        activo: true,
    };
    personal = [...personal, nuevo];
    return nuevo;
}

export function actualizar(id: string, body: ActualizarPersonalBody): Personal {
    const actual = personal.find((p) => p.id === id);
    if (!actual) throw new ApiError(404, 'NO_ENCONTRADO', 'El empleado no existe');
    if (body.codigo_empleado) validarCodigo(body.codigo_empleado, id);
    if (body.rol && !actual.perfil_id) {
        throw new ApiError(400, 'SOLICITUD_INVALIDA', 'El empleado no tiene cuenta: no se le puede asignar un rol');
    }
    const { tipo_personal_id, especialidad_id, ...resto } = body;
    const { t, e } = referencias({ tipo_personal_id, especialidad_id });
    const actualizado: Personal = {
        ...actual,
        ...resto,
        tipo: t ? { id: t.id, nombre: t.nombre } : actual.tipo,
        especialidad: especialidad_id === undefined ? actual.especialidad : e ? { id: e.id, nombre: e.nombre } : null,
        rol: body.rol ?? actual.rol,
    };
    personal = personal.map((p) => (p.id === id ? actualizado : p));
    return actualizado;
}
