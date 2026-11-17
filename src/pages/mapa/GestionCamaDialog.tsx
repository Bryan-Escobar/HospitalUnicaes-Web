import { useId, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { gestionarCama, listarMedicosActivos } from '@/services/habitaciones.service';
import type { Cama, Habitacion, OperacionCama } from '@/types/habitaciones.types';
import type { PacienteListado } from '@/types/pacientes.types';

import { SeleccionPaciente } from './SeleccionPaciente';

const TITULOS = {
    ingreso: 'Asignar cama',
    alta: 'Registrar alta',
    traslado: 'Trasladar paciente',
    limpieza: 'Marcar cama como libre',
    opciones: 'Gestionar cama',
};

const CONFIRMACIONES: Record<OperacionCama['tipo'], string> = {
    ingreso: 'Cama asignada.',
    alta: 'Alta registrada. La cama quedó en limpieza.',
    traslado: 'Traslado realizado. La cama de origen quedó en limpieza.',
    limpieza: 'Cama disponible para un nuevo ingreso.',
};

const estiloNotas = 'w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm';

export function GestionCamaDialog({ seleccion, habitaciones, sinDatos, usuario, vista, onClose, onChange, onSaved }: {
    seleccion: Cama;
    habitaciones: Habitacion[];
    sinDatos: boolean;
    usuario: string | undefined;
    vista: string | undefined;
    onClose: () => void;
    onChange: () => Promise<unknown>;
    onSaved: (mensaje: string) => void;
}) {
    const formId = useId();
    const [accion, setAccion] = useState<keyof typeof TITULOS>(
        seleccion.estado === 'disponible' ? 'ingreso' : seleccion.estado === 'limpieza' ? 'limpieza' : 'opciones',
    );
    const [paciente, setPaciente] = useState<PacienteListado | null>(null);
    const [medicoId, setMedicoId] = useState('');
    const [destinoId, setDestinoId] = useState('');
    const [texto, setTexto] = useState('');
    const habitacionesActivas = habitaciones.filter((h) => h.activa);
    const camas = habitaciones.flatMap((h) => h.camas);
    const actual = camas.find((c) => c.id === seleccion.id);
    const ocupantes = new Set(camas.flatMap((c) => c.ocupante ? [c.ocupante.paciente.id] : []));
    const destinos = habitacionesActivas.flatMap((h) => h.camas.filter((c) => c.estado === 'disponible'));
    const cambio = actual?.estado !== seleccion.estado ||
        actual?.ocupante?.hospitalizacion_id !== seleccion.ocupante?.hospitalizacion_id ||
        (accion === 'ingreso' && !destinos.some((c) => c.id === seleccion.id));
    const medicos = useQuery({
        queryKey: ['mapa-plantas-medicos', usuario, vista],
        queryFn: listarMedicosActivos,
        enabled: accion === 'ingreso' && !cambio,
        refetchOnMount: 'always',
    });
    const guardar = useMutation({
        mutationFn: gestionarCama,
        onSuccess: async (_data, operacion) => {
            await onChange();
            onSaved(CONFIRMACIONES[operacion.tipo]);
        },
        onError: () => { void onChange(); },
    });

    const hospitalizacionId = seleccion.ocupante?.hospitalizacion_id;
    const medicoValido = !!medicos.data?.some((medico) => medico.id === medicoId) && !medicos.isError;
    const destinoValido = destinos.some((c) => c.id === destinoId);
    const pacienteOcupado = !!paciente && ocupantes.has(paciente.id);
    const bloqueado = cambio || sinDatos || guardar.isPending ||
        (accion === 'ingreso' && (!paciente || pacienteOcupado || !medicoValido)) ||
        (accion === 'traslado' && !destinoValido);

    function confirmar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (bloqueado) return;
        if (accion === 'ingreso' && paciente) {
            const { id, nombres, apellidos } = paciente;
            guardar.mutate({ tipo: 'ingreso', camaId: seleccion.id, paciente: { id, nombres, apellidos }, medicoId, motivo: texto });
        } else if (accion === 'traslado' && hospitalizacionId) {
            guardar.mutate({ tipo: 'traslado', hospitalizacionId, destinoId });
        } else if (accion === 'alta' && hospitalizacionId) {
            guardar.mutate({ tipo: 'alta', hospitalizacionId, notas: texto });
        } else if (accion === 'limpieza') {
            guardar.mutate({ tipo: 'limpieza', camaId: seleccion.id });
        }
    }

    const ocupante = seleccion.ocupante?.paciente;
    const cerrar = () => { if (!guardar.isPending) onClose(); };

    return (
        <Dialog
            open
            onClose={cerrar}
            title={TITULOS[accion]}
            description={`${seleccion.codigo}${ocupante ? ` · ${ocupante.nombres} ${ocupante.apellidos}` : ''}`}
            className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
            footer={(
                <>
                    <Button variant="outline" onClick={cerrar} disabled={guardar.isPending}>Cancelar</Button>
                    {accion !== 'opciones' && (
                        <Button type="submit" form={formId} disabled={bloqueado}>
                            {guardar.isPending ? 'Guardando…' : TITULOS[accion]}
                        </Button>
                    )}
                </>
            )}
        >
            <form id={formId} onSubmit={confirmar} className="space-y-4">
                {guardar.isError && <Alert tone="danger" title={guardar.error.message || 'No se pudo guardar el cambio.'} />}
                {sinDatos && <Alert tone="warning" title="El mapa está desactualizado. Reintenta la carga para continuar." />}
                {cambio && !guardar.isPending && <Alert tone="warning" title="Esta cama cambió. Cierra el diálogo para revisar su estado actual." />}

                <fieldset disabled={cambio || sinDatos || guardar.isPending} className="min-w-0 space-y-4">
                    {accion === 'opciones' && (
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={() => setAccion('traslado')}>Trasladar paciente</Button>
                            <Button type="button" variant="outline" onClick={() => setAccion('alta')}>Registrar alta</Button>
                        </div>
                    )}
                    {accion === 'ingreso' && (
                        <>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Paciente</p>
                                <SeleccionPaciente paciente={paciente} onSelect={setPaciente} ocupantes={ocupantes} usuario={usuario} vista={vista} />
                                {pacienteOcupado && <p role="alert" className="text-sm text-danger">El paciente ya ocupa una cama.</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`${formId}-medico`}>Médico tratante</Label>
                                <Select id={`${formId}-medico`} value={medicoId} onChange={(e) => setMedicoId(e.target.value)} required>
                                    <option value="">{medicos.isPending ? 'Cargando médicos…' : 'Selecciona un médico'}</option>
                                    {medicos.data?.map((medico) => (
                                        <option key={medico.id} value={medico.id}>{medico.nombres} {medico.apellidos} · {medico.codigo_empleado}</option>
                                    ))}
                                </Select>
                                {medicos.isError && <Button type="button" variant="outline" size="sm" onClick={() => void medicos.refetch()}>Reintentar carga de médicos</Button>}
                                {medicos.data?.length === 0 && <p role="status" className="text-sm text-muted-foreground">No hay médicos activos.</p>}
                            </div>
                        </>
                    )}
                    {(accion === 'ingreso' || accion === 'alta') && (
                        <div className="space-y-2">
                            {accion === 'alta' && <p className="text-sm text-muted-foreground">El alta termina la hospitalización y deja la cama en limpieza.</p>}
                            <Label htmlFor={`${formId}-texto`}>{accion === 'ingreso' ? 'Motivo de ingreso' : 'Notas del alta'} (opcional)</Label>
                            <textarea id={`${formId}-texto`} className={estiloNotas} rows={2} maxLength={accion === 'ingreso' ? 1000 : 2000} value={texto} onChange={(e) => setTexto(e.target.value)} />
                        </div>
                    )}
                    {accion === 'traslado' && (
                        <div className="space-y-2">
                            <Label htmlFor={`${formId}-destino`}>Cama de destino</Label>
                            <Select id={`${formId}-destino`} value={destinoValido ? destinoId : ''} onChange={(e) => setDestinoId(e.target.value)} required>
                                <option value="">{destinos.length ? 'Selecciona una cama libre' : 'No hay camas libres'}</option>
                                {destinos.map((cama) => <option key={cama.id} value={cama.id}>{cama.codigo}</option>)}
                            </Select>
                            {destinoId && !destinoValido && <p role="alert" className="text-sm text-danger">La cama seleccionada ya no está libre.</p>}
                            <p className="text-sm text-muted-foreground">La cama de origen quedará en limpieza.</p>
                        </div>
                    )}
                    {accion === 'limpieza' && <p className="text-sm">Confirma que la limpieza terminó y la cama está lista para otro ingreso.</p>}
                </fieldset>
            </form>
        </Dialog>
    );
}
