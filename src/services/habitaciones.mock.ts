import { ApiError } from '@/lib/api';
import type { Cama, Habitacion, OperacionCama } from '@/types/habitaciones.types';
import { pacientes } from './mock-data';
import { obtenerFicha } from './pacientes.mock';

type Vista = 'datos' | 'vacio';

const habitaciones: Habitacion[] = ([3, 2] as const).flatMap((planta) => {
    const vip = planta === 3;
    return Array.from({ length: vip ? 5 : 6 }, (_, i) => {
        const codigo = `${vip ? 'VIP' : 'HAB'}-${planta * 100 + i + 1}`;
        const camas = (vip ? ['A'] : ['A', 'B']).map((letra): Cama => {
            const id = `${codigo}-${letra}`;
            const persona = pacientes.find((p) => p.habitacion === (vip ? codigo : `${codigo} · ${letra}`));
            const ficha = persona && obtenerFicha(persona.id);
            return {
                id, codigo: id, estado: ficha ? 'ocupada' : 'disponible',
                ocupante: ficha ? {
                    hospitalizacion_id: `ingreso-${ficha.id}`,
                    paciente: { id: ficha.id, nombres: ficha.nombres, apellidos: ficha.apellidos },
                } : null,
            };
        });
        return { id: codigo, codigo, planta, activa: true, camas };
    });
});

const mapas: Record<Vista, Habitacion[]> = {
    datos: habitaciones,
    vacio: habitaciones.map((habitacion) => ({
        ...habitacion, camas: habitacion.camas.map((cama) => ({ ...cama, estado: 'disponible', ocupante: null })),
    })),
};

export function listar(vista: Vista) {
    return mapas[vista];
}

export function gestionar(vista: Vista, operacion: OperacionCama) {
    const mapa = structuredClone(mapas[vista]);
    const camas = mapa.flatMap((habitacion) => habitacion.camas);
    const camaDisponible = (id: string) => {
        const cama = camas.find((c) => c.id === id);
        if (cama?.estado !== 'disponible') throw new ApiError(409, 'CAMA_NO_DISPONIBLE', 'La cama ya no está libre.');
        return cama;
    };

    if (operacion.tipo === 'ingreso') {
        const cama = camaDisponible(operacion.camaId);
        if (camas.some((c) => c.ocupante?.paciente.id === operacion.paciente.id)) {
            throw new ApiError(409, 'PACIENTE_YA_HOSPITALIZADO', 'El paciente ya ocupa una cama.');
        }
        cama.estado = 'ocupada';
        cama.ocupante = { hospitalizacion_id: crypto.randomUUID(), paciente: operacion.paciente };
    } else if (operacion.tipo === 'limpieza') {
        const cama = camas.find((c) => c.id === operacion.camaId);
        if (cama?.estado !== 'limpieza') throw new ApiError(409, undefined, 'La cama ya cambió de estado.');
        cama.estado = 'disponible';
    } else {
        const origen = camas.find((c) => c.ocupante?.hospitalizacion_id === operacion.hospitalizacionId);
        if (!origen?.ocupante) throw new ApiError(409, 'HOSPITALIZACION_FINALIZADA', 'La hospitalización ya finalizó.');
        if (operacion.tipo === 'traslado') {
            const destino = camaDisponible(operacion.destinoId);
            destino.estado = 'ocupada';
            destino.ocupante = origen.ocupante;
        }
        origen.estado = 'limpieza';
        origen.ocupante = null;
    }

    mapas[vista] = mapa;
}
