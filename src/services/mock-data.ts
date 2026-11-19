// Datos de ejemplo tomados de las pantallas Web del Figma (HUNI-30). Se reemplazan por la API
// cuando estén disponibles los endpoints; respetan las reglas de context.md §3
// (5 VIP + 6 semiprivadas = 17 camas, 1 ambulancia, estados exactos).
import type {
    Paciente,
    Reportes,
    PerfilAdmin,
} from '@/types/admin.types';

const NOMBRES = ['Daniel', 'Gabriela', 'Fernando', 'Patricia', 'Ricardo', 'Valeria', 'Andrés', 'Claudia', 'Emilio', 'Natalia', 'Héctor', 'Silvia', 'Mauricio', 'Beatriz', 'Rodrigo', 'Lorena', 'Samuel', 'Irene', 'Julio', 'Diana', 'Ernesto', 'Mónica', 'Kevin', 'Paola'];
const APELLIDOS = ['Castro', 'Aguilar', 'Hernández', 'Martínez', 'Portillo', 'Rivera', 'Orellana', 'Flores', 'Menjívar', 'Alvarado', 'Guevara', 'Romero', 'Campos', 'Escobar', 'Mejía', 'Quintanilla'];

function nombreSintetico(i: number) {
    return `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[(i * 7) % APELLIDOS.length]}`;
}

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
