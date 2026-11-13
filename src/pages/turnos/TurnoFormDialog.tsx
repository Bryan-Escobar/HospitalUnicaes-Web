import { useId, useRef, useState, type FormEvent } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ErrorState } from '@/components/ui/feedback-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useResource } from '@/hooks/useResource';
import { ApiError } from '@/lib/api';
import { crearTurno, listarPersonalParaTurnos } from '@/services/turnos.service';
import { TIPOS_TURNO, type CrearTurnoBody } from '@/types/turnos.types';

export function TurnoFormDialog({
    fechaInicial,
    areas,
    onClose,
    onSaved,
}: {
    fechaInicial: string;
    areas: string[];
    onClose: () => void;
    onSaved: (fecha: string) => void;
}) {
    const id = useId();
    const personal = useResource(listarPersonalParaTurnos);
    const [horas, setHoras] = useState({ inicio: '', fin: '' });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
    const envioEnCurso = useRef(false);

    async function guardar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (envioEnCurso.current || personal.status !== 'success') return;

        const form = new FormData(e.currentTarget);
        const body: CrearTurnoBody = {
            personal_id: String(form.get('personal_id')),
            fecha: String(form.get('fecha')),
            hora_inicio: horas.inicio,
            hora_fin: horas.fin,
            area: String(form.get('area')).trim(),
            tipo_turno: form.get('tipo_turno') as CrearTurnoBody['tipo_turno'],
        };
        if (!body.area || body.hora_inicio === body.hora_fin) {
            setError(new ApiError(422, 'VALIDACION', !body.area
                ? 'Escribe el área del turno.'
                : 'La hora de fin debe ser distinta de la hora de inicio.'));
            return;
        }

        envioEnCurso.current = true;
        setGuardando(true);
        setError(null);
        try {
            await crearTurno(body);
        } catch (cause) {
            setError(cause instanceof ApiError ? cause : new ApiError(500, undefined, 'Ocurrió un error al guardar el turno. Intenta de nuevo.'));
            return;
        } finally {
            envioEnCurso.current = false;
            setGuardando(false);
        }
        onSaved(body.fecha);
    }

    return (
        <Dialog
            open
            onClose={() => { if (!envioEnCurso.current) onClose(); }}
            title="Nuevo turno"
            description="Las horas corresponden a El Salvador."
            className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
            footer={
                <>
                    <Button variant="outline" disabled={guardando} onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form={id} disabled={guardando || personal.status !== 'success'}>
                        {guardando ? 'Guardando…' : 'Guardar turno'}
                    </Button>
                </>
            }
        >
            {personal.status === 'error' && <ErrorState title="No se pudo cargar el personal" onRetry={personal.refetch} />}
            {personal.status === 'loading' && <p role="status" className="text-sm text-muted-foreground">Cargando personal…</p>}
            {personal.status === 'empty' && (
                <Alert title="No hay personal activo">Registra o reactiva a un miembro del personal en Usuarios y personal.</Alert>
            )}
            {personal.status === 'success' && (
                <form id={id} onSubmit={guardar} onChange={() => setError(null)}>
                    <fieldset disabled={guardando} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-personal`}>Personal</Label>
                            <Select id={`${id}-personal`} name="personal_id" defaultValue="" required>
                                <option value="" disabled>Selecciona una persona</option>
                                {personal.data?.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombres} {p.apellidos} · {p.tipo.nombre} · {p.codigo_empleado}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-area`}>Área</Label>
                            <Input id={`${id}-area`} name="area" list={`${id}-areas`} required />
                            <datalist id={`${id}-areas`}>
                                {areas.map((area) => <option key={area} value={area} />)}
                            </datalist>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`${id}-fecha`}>Fecha de inicio</Label>
                                <Input id={`${id}-fecha`} name="fecha" type="date" defaultValue={fechaInicial} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`${id}-tipo`}>Tipo de turno</Label>
                                <Select id={`${id}-tipo`} name="tipo_turno" defaultValue="" required>
                                    <option value="" disabled>Selecciona un tipo</option>
                                    {Object.entries(TIPOS_TURNO).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`${id}-inicio`}>Hora de inicio</Label>
                                <Input id={`${id}-inicio`} type="time" required value={horas.inicio}
                                    onChange={(e) => setHoras({ ...horas, inicio: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`${id}-fin`}>Hora de fin</Label>
                                <Input id={`${id}-fin`} type="time" required value={horas.fin}
                                    onChange={(e) => setHoras({ ...horas, fin: e.target.value })} aria-describedby={`${id}-fin-ayuda`} />
                            </div>
                            <p id={`${id}-fin-ayuda`} className="col-span-2 text-xs text-muted-foreground">
                                {horas.inicio && horas.fin && horas.fin < horas.inicio
                                    ? 'El turno terminará al día siguiente.'
                                    : 'Para un turno nocturno, una hora de fin menor indica el día siguiente.'}
                            </p>
                        </div>
                        {error && (
                            <Alert tone={error.code === 'TURNO_SOLAPADO' ? 'warning' : 'danger'}
                                title={error.code === 'TURNO_SOLAPADO' ? 'Solapamiento de turnos' : 'No se pudo guardar'}>
                                {error.message}
                            </Alert>
                        )}
                    </fieldset>
                </form>
            )}
        </Dialog>
    );
}
