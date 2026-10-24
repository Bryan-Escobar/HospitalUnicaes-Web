// Datos de ejemplo tomados de las pantallas Web del Figma (HUNI-30). Se reemplazan por la API
// cuando estén disponibles los endpoints; respetan las reglas de context.md §3
// (5 VIP + 6 semiprivadas = 17 camas, 1 ambulancia, estados exactos).
import type {
    AmbulanciaEstado,
    Aviso,
    DashboardResumen,
    InventarioResumen,
    MapaPlantas,
    OrdenLaboratorio,
    Paciente,
    PerfilAdmin,
    PersonaPersonal,
    Recurso,
    Reportes,
    SemanaTurnos,
    ServicioBitacora,
} from '@/types/admin.types';

export const perfil: PerfilAdmin = {
    nombre: 'Rosa Guzmán',
    cargo: 'Administrador · Jefe de Operaciones',
    correo: 'rosa.guzman@hospital.edu',
    telefono: '7000-0001',
    passwordCambiada: 'cambiada hace 2 meses',
    sesionesActivas: 1,
};

export const dashboard: DashboardResumen = {
    fecha: 'Miércoles 21 de octubre',
    ocupacion: { ocupadas: 12, total: 17 },
    vip: { ocupadas: 3, total: 5 },
    semiprivadas: { ocupadas: 9, total: 12 },
    ambulancia: { estado: 'en_servicio', detalle: 'Despachada 10:14 · Emergencia cardíaca' },
    citasHoy: { total: 18, atendidas: 11, programadas: 6, canceladas: 1 },
    personalDeTurno: { total: 9, doctores: 4, enfermeria: 3, recepcion: 2 },
    ocupacionPorDia: [
        { dia: 'Jue', ocupadas: 10 },
        { dia: 'Vie', ocupadas: 11 },
        { dia: 'Sáb', ocupadas: 13 },
        { dia: 'Dom', ocupadas: 12 },
        { dia: 'Lun', ocupadas: 14 },
        { dia: 'Mar', ocupadas: 13 },
        { dia: 'Mié', ocupadas: 12 },
    ],
    laboratorio: { pendiente: 7, en_proceso: 4, completado: 16 },
    medicosDeTurno: [
        { nombre: 'Dr. Carlos Molina', horario: '07:00–15:00', area: 'Medicina general', tono: 'primary' },
        { nombre: 'Dra. Ana Rivas', horario: '08:00–14:00', area: 'Alergista', tono: 'primary' },
        { nombre: 'Dr. Jorge Peña', horario: '06:00–18:00', area: 'Emergencia', tono: 'danger' },
        { nombre: 'Dra. Sofía Hernández', horario: '14:00–22:00', area: 'Medicina general', tono: 'primary' },
    ],
};

const personalDiseno: PersonaPersonal[] = [
    { id: 'u1', nombre: 'Rosa Guzmán', correo: 'rosa.guzman@hospital.edu', rol: 'Administrador', tipo: 'Jefe de Operaciones', conCuenta: true, activo: true },
    { id: 'u2', nombre: 'Dra. Ana Rivas', correo: 'ana.rivas@hospital.edu', rol: 'Doctor', tipo: 'Alergista', conCuenta: true, activo: true },
    { id: 'u3', nombre: 'Dr. Carlos Molina', correo: 'carlos.molina@hospital.edu', rol: 'Doctor', tipo: 'Doctor · General', conCuenta: true, activo: true },
    { id: 'u4', nombre: 'Dr. Jorge Peña', correo: 'jorge.pena@hospital.edu', rol: 'Doctor', tipo: 'Médico de emergencia', conCuenta: true, activo: true },
    { id: 'u5', nombre: 'Karla Flores', correo: 'karla.flores@hospital.edu', rol: 'Recepcionista/Asistente', tipo: 'Asistente', conCuenta: true, activo: true },
    { id: 'u6', nombre: 'Óscar Ramos', correo: 'oscar.ramos@hospital.edu', rol: 'Recepcionista/Asistente', tipo: 'Recepcionista', conCuenta: true, activo: true },
    { id: 'u7', nombre: 'Lucía Torres', correo: 'lucia.torres@hospital.edu', rol: 'Recepcionista/Asistente', tipo: 'Enfermera', conCuenta: true, activo: true },
    { id: 'u8', nombre: 'Raúl Campos', correo: null, rol: null, tipo: 'Conductor de ambulancia', conCuenta: false, activo: true },
    { id: 'u9', nombre: 'Dra. Sofía Hernández', correo: 'sofia.h@hospital.edu', rol: 'Doctor', tipo: 'Doctor · General', conCuenta: true, activo: true },
    { id: 'u10', nombre: 'Marta Díaz', correo: 'marta.diaz@hospital.edu', rol: 'Recepcionista/Asistente', tipo: 'Recepcionista', conCuenta: true, activo: false },
];

const NOMBRES = ['Daniel', 'Gabriela', 'Fernando', 'Patricia', 'Ricardo', 'Valeria', 'Andrés', 'Claudia', 'Emilio', 'Natalia', 'Héctor', 'Silvia', 'Mauricio', 'Beatriz', 'Rodrigo', 'Lorena', 'Samuel', 'Irene', 'Julio', 'Diana', 'Ernesto', 'Mónica', 'Kevin', 'Paola'];
const APELLIDOS = ['Castro', 'Aguilar', 'Hernández', 'Martínez', 'Portillo', 'Rivera', 'Orellana', 'Flores', 'Menjívar', 'Alvarado', 'Guevara', 'Romero', 'Campos', 'Escobar', 'Mejía', 'Quintanilla'];

function nombreSintetico(i: number) {
    return `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[(i * 7) % APELLIDOS.length]}`;
}

function slug(nombre: string) {
    return nombre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '.');
}

const TIPOS_EXTRA: [PersonaPersonal['rol'], string][] = [
    ['Recepcionista/Asistente', 'Enfermera'],
    ['Recepcionista/Asistente', 'Enfermero'],
    ['Doctor', 'Doctor · General'],
    ['Recepcionista/Asistente', 'Asistente'],
    ['Doctor', 'Pediatra'],
    ['Recepcionista/Asistente', 'Recepcionista'],
];

// 34 personas · 31 con cuenta de acceso (WEB-3)
export const personal: PersonaPersonal[] = [
    ...personalDiseno,
    ...Array.from({ length: 24 }, (_, i): PersonaPersonal => {
        const nombre = nombreSintetico(i + 3);
        const [rol, tipo] = TIPOS_EXTRA[i % TIPOS_EXTRA.length]!;
        const soloTurnos = i >= 22; // 2 más sin cuenta (con Raúl Campos son 3)
        return {
            id: `u${i + 11}`,
            nombre: rol === 'Doctor' ? `Dr. ${nombre}` : nombre,
            correo: soloTurnos ? null : `${slug(nombre)}@hospital.edu`,
            rol: soloTurnos ? null : rol,
            tipo: soloTurnos ? 'Mantenimiento' : tipo,
            conCuenta: !soloTurnos,
            activo: i % 9 !== 4,
        };
    }),
];

const pacientesDiseno: Paciente[] = [
    { id: 'p1', nombre: 'Luis Martínez', documento: '01234567-8', telefono: '7000-1111', habitacion: 'HAB-204 · A', ultimaConsulta: '14 oct', medico: 'Dra. Ana Rivas' },
    { id: 'p2', nombre: 'María López', documento: '04512378-9', telefono: '7000-3333', habitacion: 'HAB-202 · B', ultimaConsulta: 'Hoy', medico: 'Dr. Jorge Peña' },
    { id: 'p3', nombre: 'Rosa Méndez', documento: '02233445-6', telefono: '7000-4444', habitacion: 'VIP-302', ultimaConsulta: 'Hoy', medico: 'Dra. Ana Rivas' },
    { id: 'p4', nombre: 'Tomás Mora', documento: '06677889-0', telefono: '7000-5555', habitacion: 'HAB-206 · A', ultimaConsulta: '20 oct', medico: 'Dr. Jorge Peña' },
    { id: 'p5', nombre: 'Elena Cruz', documento: '03344556-1', telefono: '7000-6666', habitacion: null, ultimaConsulta: '2 oct', medico: 'Dr. Carlos Molina' },
    { id: 'p6', nombre: 'Mario Ruiz', documento: '05566778-2', telefono: '7000-7777', habitacion: null, ultimaConsulta: '28 sep', medico: 'Dra. Ana Rivas' },
    { id: 'p7', nombre: 'Pedro Alas', documento: '07788990-3', telefono: '7000-8888', habitacion: null, ultimaConsulta: 'Hoy', medico: 'Dra. Ana Rivas' },
    { id: 'p8', nombre: 'Ana Vega', documento: '08899001-4', telefono: '7000-9999', habitacion: 'HAB-204 · B', ultimaConsulta: 'Hoy', medico: 'Dr. Jorge Peña' },
    { id: 'p9', nombre: 'Carla Ríos', documento: '09900112-5', telefono: '7100-0000', habitacion: 'HAB-203 · A', ultimaConsulta: '15 oct', medico: 'Dr. Carlos Molina' },
    { id: 'p10', nombre: 'José Díaz', documento: '01122334-6', telefono: '7100-1111', habitacion: 'HAB-201 · B', ultimaConsulta: '18 oct', medico: 'Dr. Carlos Molina' },
];

// Hospitalizados restantes hasta completar 12 de 17 camas (ver mapa de plantas)
const hospitalizadosExtra: [string, string][] = [
    ['Jaime Ortiz', 'VIP-301'],
    ['Fabiola Luna', 'VIP-304'],
    ['Laura Gómez', 'HAB-201 · A'],
    ['Ramón Paz', 'HAB-202 · A'],
    ['Ernesto Lara', 'HAB-205 · A'],
];

const MEDICOS = ['Dr. Carlos Molina', 'Dra. Ana Rivas', 'Dr. Jorge Peña', 'Dra. Sofía Hernández'];
const FECHAS = ['1 oct', '3 oct', '7 oct', '9 oct', '12 sep', '19 sep', '25 sep', '30 ago', '16 oct', '22 ago'];

// 212 pacientes registrados · 12 hospitalizados (WEB-4)
export const pacientes: Paciente[] = [
    ...pacientesDiseno,
    ...hospitalizadosExtra.map(([nombre, habitacion], i): Paciente => ({
        id: `p${11 + i}`,
        nombre,
        documento: `0${3456789 + i * 1111}-${i + 2}`,
        telefono: `71${String(20 + i).padStart(2, '0')}-2222`,
        habitacion,
        ultimaConsulta: '19 oct',
        medico: MEDICOS[i % MEDICOS.length]!,
    })),
    ...Array.from({ length: 197 }, (_, i): Paciente => {
        const n = 16 + i;
        return {
            id: `p${n}`,
            nombre: nombreSintetico(i),
            documento: `${String(10000000 + ((i * 7919) % 89999999)).padStart(8, '0')}-${i % 10}`,
            telefono: `7${String(200 + (i % 800)).padStart(3, '0')}-${String(1000 + ((i * 37) % 9000))}`,
            habitacion: null,
            ultimaConsulta: FECHAS[i % FECHAS.length]!,
            medico: MEDICOS[i % MEDICOS.length]!,
        };
    }),
];

export const turnos: SemanaTurnos = {
    titulo: 'Semana del 19 al 25 de octubre',
    dias: ['Lun 19', 'Mar 20', 'Mié 21', 'Jue 22', 'Vie 23', 'Sáb 24', 'Dom 25'],
    conflicto:
        'Dra. Sofía Hernández tendría dos turnos el jueves 22 (12:00–20:00 y 14:00–22:00). El turno nuevo no se guardó.',
    filas: [
        {
            id: 't1', nombre: 'Dra. Ana Rivas', tipo: 'Alergista',
            dias: [{ horario: '08:00–14:00', area: 'C. externa' }, null, { horario: '08:00–14:00', area: 'C. externa' }, { horario: '08:00–14:00', area: 'C. externa' }, null, null, null],
        },
        {
            id: 't2', nombre: 'Dr. Carlos Molina', tipo: 'Doctor',
            dias: [{ horario: '07:00–15:00' }, { horario: '07:00–15:00' }, { horario: '07:00–15:00' }, null, { horario: '07:00–15:00' }, null, null],
        },
        {
            id: 't3', nombre: 'Dr. Jorge Peña', tipo: 'Emergencia',
            dias: [{ horario: '06:00–18:00', area: 'Emergencias' }, null, { horario: '06:00–18:00', area: 'Emergencias' }, null, { horario: '18:00–06:00', area: 'Nocturno' }, null, null],
        },
        {
            id: 't4', nombre: 'Dra. Sofía Hernández', tipo: 'Doctor',
            dias: [null, { horario: '14:00–22:00' }, { horario: '14:00–22:00' }, { horario: '12:00–20:00 y 14:00–22:00', solapa: true }, null, { horario: '08:00–16:00' }, null],
        },
        {
            id: 't5', nombre: 'Lucía Torres', tipo: 'Enfermera',
            dias: [{ horario: '06:00–14:00', area: 'Planta 2' }, { horario: '06:00–14:00', area: 'Planta 2' }, { horario: '06:00–14:00', area: 'Planta 2' }, { horario: '06:00–14:00', area: 'Planta 3' }, null, null, null],
        },
        {
            id: 't6', nombre: 'Karla Flores', tipo: 'Asistente',
            dias: [{ horario: '07:00–15:00', area: 'Laboratorio' }, { horario: '07:00–15:00' }, { horario: '07:00–15:00' }, { horario: '07:00–15:00' }, { horario: '07:00–15:00' }, null, null],
        },
        {
            id: 't7', nombre: 'Óscar Ramos', tipo: 'Recepcionista',
            dias: [{ horario: '07:00–15:00' }, { horario: '07:00–15:00' }, { horario: '07:00–15:00' }, null, null, { horario: '07:00–15:00' }, { horario: '07:00–15:00' }],
        },
        {
            id: 't8', nombre: 'Raúl Campos', tipo: 'Conductor (solo turnos)',
            dias: [{ horario: '06:00–18:00', area: 'Ambulancia' }, null, { horario: '06:00–18:00', area: 'Ambulancia' }, null, { horario: '06:00–18:00', area: 'Ambulancia' }, null, null],
        },
    ],
};

export const mapa: MapaPlantas = {
    ultimoCambio: 'HAB-202 · B pasó a Ocupada (asignada desde Android por Karla Flores).',
    plantas: [
        {
            numero: 3,
            nombre: 'VIP',
            habitaciones: [
                { codigo: 'VIP-301', camas: [{ cama: null, paciente: 'J. Ortiz' }] },
                { codigo: 'VIP-302', camas: [{ cama: null, paciente: 'R. Méndez' }] },
                { codigo: 'VIP-303', camas: [{ cama: null, paciente: null }] },
                { codigo: 'VIP-304', camas: [{ cama: null, paciente: 'F. Luna' }] },
                { codigo: 'VIP-305', camas: [{ cama: null, paciente: null }] },
            ],
        },
        {
            numero: 2,
            nombre: 'semiprivadas',
            habitaciones: [
                { codigo: 'HAB-201', camas: [{ cama: 'A', paciente: 'L. Gómez' }, { cama: 'B', paciente: 'J. Díaz' }] },
                { codigo: 'HAB-202', camas: [{ cama: 'A', paciente: 'R. Paz' }, { cama: 'B', paciente: 'M. López' }] },
                { codigo: 'HAB-203', camas: [{ cama: 'A', paciente: 'C. Ríos' }, { cama: 'B', paciente: null }] },
                { codigo: 'HAB-204', camas: [{ cama: 'A', paciente: 'L. Martínez' }, { cama: 'B', paciente: 'A. Vega' }] },
                { codigo: 'HAB-205', camas: [{ cama: 'A', paciente: 'E. Lara' }, { cama: 'B', paciente: null }] },
                { codigo: 'HAB-206', camas: [{ cama: 'A', paciente: 'T. Mora' }, { cama: 'B', paciente: null }] },
            ],
        },
    ],
};

const recursosDiseno: Recurso[] = [
    { id: 'r1', nombre: 'Guantes de nitrilo (caja)', categoria: 'Insumos', cantidad: 12, minimo: 20, ubicacion: 'Bodega central' },
    { id: 'r2', nombre: 'Mascarillas N95', categoria: 'Insumos', cantidad: 140, minimo: 50, ubicacion: 'Bodega central' },
    { id: 'r3', nombre: 'Suero fisiológico 1 L', categoria: 'Medicamentos', cantidad: 8, minimo: 30, ubicacion: 'Farmacia' },
    { id: 'r4', nombre: 'Tanque de oxígeno', categoria: 'Equipos', cantidad: 6, minimo: 4, ubicacion: 'Planta 2' },
    { id: 'r5', nombre: 'Monitor de signos vitales', categoria: 'Equipos', cantidad: 9, minimo: 5, ubicacion: 'Planta 3' },
    { id: 'r6', nombre: 'Silla de ruedas', categoria: 'Mobiliario', cantidad: 7, minimo: 4, ubicacion: 'Recepción' },
    { id: 'r7', nombre: 'Jeringas 5 ml', categoria: 'Insumos', cantidad: 45, minimo: 100, ubicacion: 'Farmacia' },
    { id: 'r8', nombre: 'Desfibrilador portátil', categoria: 'Equipos', cantidad: 1, minimo: 2, ubicacion: 'Ambulancia' },
    { id: 'r9', nombre: 'Sábanas', categoria: 'Lencería', cantidad: 64, minimo: 40, ubicacion: 'Lavandería' },
];

const RECURSOS_EXTRA: [string, string, string][] = [
    ['Gasas estériles', 'Insumos', 'Bodega central'],
    ['Paracetamol 500 mg', 'Medicamentos', 'Farmacia'],
    ['Loratadina 10 mg', 'Medicamentos', 'Farmacia'],
    ['Termómetro digital', 'Equipos', 'Planta 2'],
    ['Camilla plegable', 'Mobiliario', 'Emergencias'],
    ['Batas quirúrgicas', 'Lencería', 'Lavandería'],
    ['Alcohol gel 1 L', 'Higiene', 'Bodega central'],
    ['Esfigmomanómetro', 'Equipos', 'Planta 3'],
    ['Vendas elásticas', 'Insumos', 'Farmacia'],
    ['Toallas', 'Lencería', 'Lavandería'],
];

// 86 recursos en 6 categorías · 4 con stock bajo (WEB-7)
export const recursos: Recurso[] = [
    ...recursosDiseno,
    ...Array.from({ length: 77 }, (_, i): Recurso => {
        const [nombre, categoria, ubicacion] = RECURSOS_EXTRA[i % RECURSOS_EXTRA.length]!;
        const lote = Math.floor(i / RECURSOS_EXTRA.length);
        return {
            id: `r${10 + i}`,
            nombre: lote === 0 ? nombre : `${nombre} (lote ${lote + 1})`,
            categoria,
            cantidad: 20 + ((i * 13) % 80),
            minimo: 10 + (i % 10),
            ubicacion,
        };
    }),
];

export const inventarioResumen: InventarioResumen = {
    registrados: 86,
    categorias: 6,
    ultimaActualizacion: 'Hoy 09:12',
    actualizadoPor: 'Rosa Guzmán',
};

// 27 órdenes: 7 Pendiente · 4 En Proceso · 16 Completado (WEB-8)
const ordenesDiseno: OrdenLaboratorio[] = [
    { id: 1042, examen: 'Examen general de orina', paciente: 'Luis Martínez', doctor: 'Dr. Molina', creada: '10:41', estado: 'en_proceso', resultado: null },
    { id: 1041, examen: 'Hemograma completo', paciente: 'María López', doctor: 'Dr. Peña', creada: '09:40', estado: 'pendiente', resultado: null },
    { id: 1040, examen: 'Química sanguínea', paciente: 'Elena Cruz', doctor: 'Dr. Molina', creada: '09:15', estado: 'pendiente', resultado: null },
    { id: 1039, examen: 'Prueba cutánea', paciente: 'Pedro Alas', doctor: 'Dra. Rivas', creada: '08:50', estado: 'pendiente', resultado: null },
    { id: 1038, examen: 'Hemograma completo', paciente: 'Tomás Mora', doctor: 'Dr. Peña', creada: '08:10', estado: 'completado', resultado: { pdf: true, texto: true } },
    { id: 1037, examen: 'Química sanguínea', paciente: 'Tomás Mora', doctor: 'Dr. Peña', creada: '08:10', estado: 'en_proceso', resultado: null },
    { id: 1036, examen: 'Perfil lipídico', paciente: 'Rosa Méndez', doctor: 'Dr. Molina', creada: 'ayer', estado: 'pendiente', resultado: null },
    { id: 1035, examen: 'Prueba cutánea', paciente: 'Luis Martínez', doctor: 'Dra. Rivas', creada: '14 oct', estado: 'completado', resultado: { pdf: true, texto: true } },
    { id: 1034, examen: 'Radiografía de tórax', paciente: 'Ana Vega', doctor: 'Dr. Peña', creada: '13 oct', estado: 'completado', resultado: { pdf: true, texto: false } },
    { id: 1033, examen: 'Glucosa en ayunas', paciente: 'José Díaz', doctor: 'Dr. Molina', creada: '12 oct', estado: 'completado', resultado: { pdf: false, texto: true } },
];

const EXAMENES = ['Hemograma completo', 'Química sanguínea', 'Perfil lipídico', 'Glucosa en ayunas', 'Examen general de orina', 'Prueba cutánea'];
const ESTADOS_RESTO: OrdenLaboratorio['estado'][] = [
    'pendiente', 'pendiente', 'pendiente', 'en_proceso', 'en_proceso',
    'completado', 'completado', 'completado', 'completado', 'completado', 'completado',
    'completado', 'completado', 'completado', 'completado', 'completado', 'completado',
];

export const ordenes: OrdenLaboratorio[] = [
    ...ordenesDiseno,
    ...ESTADOS_RESTO.map((estado, i): OrdenLaboratorio => ({
        id: 1032 - i,
        examen: EXAMENES[i % EXAMENES.length]!,
        paciente: pacientes[12 + i]!.nombre,
        doctor: ['Dr. Molina', 'Dra. Rivas', 'Dr. Peña', 'Dra. Hernández'][i % 4]!,
        creada: `${11 - Math.floor(i / 3)} oct`,
        estado,
        resultado: estado === 'completado' ? { pdf: i % 2 === 0, texto: true } : null,
    })),
];

export const ambulancia: AmbulanciaEstado = {
    estado: 'en_servicio',
    desde: '10:14',
    servicio: {
        paciente: 'Luis Martínez',
        ubicacion: 'Col. Escalón, San Salvador',
        despachadaPor: 'Karla Flores (Android) · 10:14',
        tipoEmergencia: 'Dolor de pecho',
        solicitada: '10:12 desde la app iOS',
        conductor: 'Raúl Campos',
    },
    solicitudesPendientes: [],
};

// 14 servicios del 01/10 al 21/10 (WEB-10)
export const bitacora: ServicioBitacora[] = [
    { id: 'b1', fecha: '21 oct', inicioFin: '10:14 – 11:02', tipo: 'Dolor de pecho', paciente: 'Luis Martínez', despacho: 'Karla Flores', duracion: '48 min', resultado: 'finalizado' },
    { id: 'b2', fecha: '19 oct', inicioFin: '22:40 – 23:35', tipo: 'Accidente de tránsito', paciente: 'María López', despacho: 'Óscar Ramos', duracion: '55 min', resultado: 'finalizado' },
    { id: 'b3', fecha: '18 oct', inicioFin: '07:10', tipo: 'Dificultad respiratoria', paciente: 'José Díaz', despacho: 'Karla Flores', duracion: null, resultado: 'rechazada' },
    { id: 'b4', fecha: '15 oct', inicioFin: '08:00 – 12:00', tipo: 'Mantenimiento preventivo', paciente: null, despacho: 'Rosa Guzmán', duracion: '4 h', resultado: 'en_mantenimiento' },
    { id: 'b5', fecha: '12 oct', inicioFin: '16:20 – 17:05', tipo: 'Caída', paciente: 'Ana Vega', despacho: 'Óscar Ramos', duracion: '45 min', resultado: 'finalizado' },
    { id: 'b6', fecha: '9 oct', inicioFin: '03:15 – 04:10', tipo: 'Dolor abdominal', paciente: 'Tomás Mora', despacho: 'Lucía Torres', duracion: '55 min', resultado: 'finalizado' },
    { id: 'b7', fecha: '6 oct', inicioFin: '12:00', tipo: 'Otro', paciente: 'Carla Ríos', despacho: 'Karla Flores', duracion: null, resultado: 'no_disponible' },
    { id: 'b8', fecha: '4 oct', inicioFin: '18:30 – 19:20', tipo: 'Accidente', paciente: 'Pedro Alas', despacho: 'Óscar Ramos', duracion: '50 min', resultado: 'finalizado' },
    { id: 'b9', fecha: '2 oct', inicioFin: '09:45 – 10:30', tipo: 'Dificultad respiratoria', paciente: 'Rosa Méndez', despacho: 'Karla Flores', duracion: '45 min', resultado: 'finalizado' },
    { id: 'b10', fecha: '1 oct', inicioFin: '14:10 – 15:00', tipo: 'Dolor de pecho', paciente: 'Mario Ruiz', despacho: 'Lucía Torres', duracion: '50 min', resultado: 'finalizado' },
    { id: 'b11', fecha: '1 oct', inicioFin: '08:20 – 09:05', tipo: 'Caída', paciente: 'Elena Cruz', despacho: 'Óscar Ramos', duracion: '45 min', resultado: 'finalizado' },
    { id: 'b12', fecha: '1 oct', inicioFin: '06:40 – 07:30', tipo: 'Accidente de tránsito', paciente: 'Gabriela Aguilar', despacho: 'Karla Flores', duracion: '50 min', resultado: 'finalizado' },
    { id: 'b13', fecha: '1 oct', inicioFin: '02:10 – 02:55', tipo: 'Dolor abdominal', paciente: 'Fernando Hernández', despacho: 'Lucía Torres', duracion: '45 min', resultado: 'finalizado' },
    { id: 'b14', fecha: '1 oct', inicioFin: '00:30 – 01:20', tipo: 'Dificultad respiratoria', paciente: 'Patricia Martínez', despacho: 'Óscar Ramos', duracion: '50 min', resultado: 'finalizado' },
];

export const avisos: Aviso[] = [
    { id: 'a1', titulo: 'Horario de visitas', publico: true, vigencia: '19 oct – 30 nov', estado: 'vigente' },
    { id: 'a2', titulo: 'Reunión clínica mensual', publico: false, vigencia: '21 oct – 23 oct', estado: 'vigente' },
    { id: 'a3', titulo: 'Jornada de vacunación', publico: true, vigencia: '2 nov – 6 nov', estado: 'programado' },
    { id: 'a4', titulo: 'Mantenimiento de ascensores', publico: false, vigencia: '5 oct – 7 oct', estado: 'vencido' },
];

const OCUPACION_30_DIAS = [11, 12, 12, 13, 12, 14, 13, 12, 11, 12, 13, 14, 13, 12, 12, 13, 14, 13, 12, 11, 12, 13, 13, 12, 14, 13, 12, 13, 12, 12];

export const reportes: Reportes = {
    ocupacionHistorica: OCUPACION_30_DIAS.map((ocupadas, i) => ({ dia: `${((i + 21) % 30) + 1} ${i < 9 ? 'sep' : 'oct'}`, ocupadas })),
    ambulanciaPorSemana: [
        { semana: 'Sem 39', servicios: 2 },
        { semana: 'Sem 40', servicios: 3 },
        { semana: 'Sem 41', servicios: 2 },
        { semana: 'Sem 42', servicios: 4 },
    ],
    laboratorio: { pendiente: 21, en_proceso: 13, completado: 142 },
    citasPorDoctor: [
        { doctor: 'Dr. Carlos Molina', citas: 96 },
        { doctor: 'Dra. Ana Rivas', citas: 72 },
        { doctor: 'Dra. Sofía Hernández', citas: 60 },
        { doctor: 'Dr. Jorge Peña', citas: 33 },
    ],
};
