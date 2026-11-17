import { useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AuthContext } from '@/context/AuthContext';
import { isDemoMode, supabase } from '@/lib/client';
import { listarHabitaciones } from '@/services/habitaciones.service';
import { useDemoStore } from '@/store/useDemoStore';

let siguienteCanal = 0;

export function useMapaPlantas() {
    const { session } = useContext(AuthContext);
    const usuario = session?.user.id;
    const mode = useDemoStore((s) => s.mode);
    const vista = isDemoMode ? mode : undefined;
    const client = useQueryClient();
    const [enVivo, setEnVivo] = useState(false);
    const mapa = useQuery({
        queryKey: ['mapa-plantas', usuario, vista],
        queryFn: ({ signal }) => listarHabitaciones(signal),
        refetchOnMount: 'always',
        refetchInterval: (query) => !isDemoMode && (!enVivo || query.state.status === 'error') ? 30_000 : false,
    });

    useEffect(() => {
        if (isDemoMode) return;

        const queryKey = ['mapa-plantas', usuario, vista];
        let activo = true;
        let temporizador: ReturnType<typeof setTimeout>;
        function actualizar() {
            clearTimeout(temporizador);
            // Ingreso y traslado pueden cambiar varias filas. Se vuelve a leer el mapa por la API, con sus permisos.
            temporizador = setTimeout(async () => {
                await client.cancelQueries({ queryKey, exact: true });
                if (activo) await client.invalidateQueries({ queryKey, exact: true });
            }, 120);
        }

        // Un nuevo montaje puede coincidir con la salida asíncrona del canal anterior.
        const canal = supabase.channel(`mapa-plantas-${++siguienteCanal}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'camas' }, actualizar)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitalizaciones' }, actualizar)
            .subscribe((estado) => {
                if (!activo) return;
                setEnVivo(estado === 'SUBSCRIBED');
                if (estado === 'SUBSCRIBED') actualizar();
            });

        return () => {
            activo = false;
            clearTimeout(temporizador);
            void supabase.removeChannel(canal);
        };
    }, [client, usuario, vista]);

    return { ...mapa, enVivo, usuario, vista };
}
