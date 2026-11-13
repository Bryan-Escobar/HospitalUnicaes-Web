import { ResourceView } from '@/components/ResourceView';
import { Dialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { obtenerOrden } from '@/services/laboratorio.service';
import type { EstadoLaboratorio } from '@/types/admin.types';
import type { DetalleOrdenLaboratorio, PersonaLaboratorio } from '@/types/laboratorio.types';
import { fechaHoraLaboratorio, nombreCompleto } from './formato-laboratorio';

function historialOrden(orden: DetalleOrdenLaboratorio) {
    const historial: { estado: EstadoLaboratorio; fecha: string | null }[] = [
        { estado: 'pendiente', fecha: orden.fecha_solicitud },
    ];
    // El primer examen iniciado pone la orden en proceso y el último completado la cierra.
    const iniciados = orden.examenes.filter((examen) => examen.estado !== 'pendiente');
    if (orden.estado !== 'pendiente') {
        const fechas = iniciados.map((examen) => examen.fecha_inicio);
        const inicio = fechas.every((fecha) => fecha !== null)
            ? fechas.sort((a, b) => Date.parse(a) - Date.parse(b))[0]
            : null;
        historial.push({ estado: 'en_proceso', fecha: inicio ?? null });
    }
    if (orden.estado === 'completado') {
        const fechas = orden.examenes.map((examen) => examen.fecha_completado);
        const fin = fechas.every((fecha) => fecha !== null)
            ? fechas.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1)
            : null;
        historial.push({ estado: 'completado', fecha: fin ?? null });
    }
    return historial;
}

function OrdenDetalle({ orden }: { orden: DetalleOrdenLaboratorio }) {
    const personas: [string, PersonaLaboratorio][] = [
        ['Paciente', orden.consulta.expediente.paciente],
        ['Doctor', orden.consulta.doctor],
    ];
    return (
        <div className="space-y-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
                {personas.map(([label, persona]) => (
                    <div key={label}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium">{nombreCompleto(persona)}</dd>
                    </div>
                ))}
                {orden.indicaciones && (
                    <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Indicaciones</dt>
                        <dd className="whitespace-pre-wrap wrap-break-word">{orden.indicaciones}</dd>
                    </div>
                )}
            </dl>
            <section aria-labelledby="historial-orden">
                <h3 id="historial-orden" className="mb-2 text-sm font-semibold">Historial de estados</h3>
                <ol className="divide-y divide-border rounded-md border border-border">
                    {historialOrden(orden).map(({ estado, fecha }) => (
                        <li key={estado} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                            <StatusBadge estado={estado} />
                            {fecha
                                ? <time dateTime={fecha}>{fechaHoraLaboratorio(fecha)}</time>
                                : <span className="text-muted-foreground">Fecha sin registro</span>}
                        </li>
                    ))}
                </ol>
            </section>
            <section aria-labelledby="examenes-orden">
                <h3 id="examenes-orden" className="mb-2 text-sm font-semibold">Exámenes</h3>
                {orden.examenes.length === 0 ? <p className="text-sm text-muted-foreground">Sin exámenes registrados.</p> : (
                    <ul className="divide-y divide-border rounded-md border border-border">
                        {orden.examenes.map((examen) => (
                            <li key={examen.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                                {examen.examen.nombre}
                                <StatusBadge estado={examen.estado} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export function OrdenLaboratorioDialog({ id, onClose }: { id: string; onClose: () => void }) {
    const orden = useResource(() => obtenerOrden(id), [id]);
    return (
        <Dialog
            open
            onClose={onClose}
            title={`Orden #${id.slice(0, 8)}`}
            className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
            <ResourceView resource={orden} empty={{ title: 'Orden no disponible' }}>
                {(data) => <OrdenDetalle orden={data} />}
            </ResourceView>
        </Dialog>
    );
}
