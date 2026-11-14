import { useEffect, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ApiError } from '@/lib/api';
import { fechaHoraHospital, instanteDesdeFechaHora } from '@/lib/fechas-hospital';
import { actualizarAviso, crearAviso } from '@/services/avisos.service';
import type { ActualizarAvisoBody, Aviso, CrearAvisoBody } from '@/types/avisos.types';
import { AvisoPreview } from './AvisoPreview';

// Mismos límites que la API (HUNI-74).
export const MAX_TITULO = 150;
export const MAX_CONTENIDO = 5000;

interface Formulario {
    titulo: string;
    contenido: string;
    visibilidad: 'publico' | 'interno';
    publicacion: string; // datetime-local en hora del hospital
    expiracion: string; // '' = no expira
}

// Las claves son los nombres de campo de la API para asociar sus errores de validación al campo.
type Errores = Partial<Record<'titulo' | 'contenido' | 'fecha_publicacion' | 'fecha_expiracion', string>>;

function formularioInicial(aviso: Aviso | null): Formulario {
    if (!aviso) return { titulo: '', contenido: '', visibilidad: 'publico', publicacion: fechaHoraHospital(), expiracion: '' };
    return {
        titulo: aviso.titulo,
        contenido: aviso.contenido,
        visibilidad: aviso.es_publico ? 'publico' : 'interno',
        publicacion: fechaHoraHospital(aviso.fecha_publicacion),
        expiracion: aviso.fecha_expiracion ? fechaHoraHospital(aviso.fecha_expiracion) : '',
    };
}

function aCuerpo(f: Formulario): CrearAvisoBody {
    return {
        titulo: f.titulo.trim(),
        contenido: f.contenido.trim(),
        es_publico: f.visibilidad === 'publico',
        fecha_publicacion: instanteDesdeFechaHora(f.publicacion),
        fecha_expiracion: f.expiracion ? instanteDesdeFechaHora(f.expiracion) : null,
    };
}

function validar(f: Formulario): Errores {
    const errores: Errores = {};
    if (!f.titulo.trim()) errores.titulo = 'Escribe un título.';
    else if (f.titulo.trim().length > MAX_TITULO) errores.titulo = `Máximo ${MAX_TITULO} caracteres.`;
    if (!f.contenido.trim()) errores.contenido = 'Escribe el contenido del aviso.';
    else if (f.contenido.trim().length > MAX_CONTENIDO) errores.contenido = `Máximo ${MAX_CONTENIDO} caracteres.`;
    if (!f.publicacion) errores.fecha_publicacion = 'Indica desde cuándo se muestra.';
    if (f.expiracion && f.publicacion && f.expiracion <= f.publicacion) {
        errores.fecha_expiracion = 'Debe ser posterior a la fecha de publicación.';
    }
    return errores;
}

// En la edición solo se envía lo que cambió, para no reescribir las fechas con la precisión del formulario.
function cambios(original: Formulario, actual: Formulario): ActualizarAvisoBody {
    const antes = aCuerpo(original);
    const despues = aCuerpo(actual);
    const body: ActualizarAvisoBody = {};
    if (despues.titulo !== antes.titulo) body.titulo = despues.titulo;
    if (despues.contenido !== antes.contenido) body.contenido = despues.contenido;
    if (despues.es_publico !== antes.es_publico) body.es_publico = despues.es_publico;
    if (actual.publicacion !== original.publicacion) body.fecha_publicacion = despues.fecha_publicacion;
    if (actual.expiracion !== original.expiracion) body.fecha_expiracion = despues.fecha_expiracion;
    return body;
}

// Traduce un error de la API al campo que lo causó; lo que no tiene campo se muestra arriba.
function erroresDeApi(error: unknown): { campos: Errores; general: string | null } {
    if (!(error instanceof ApiError)) return { campos: {}, general: 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.' };
    if (error.errors.length > 0) {
        const campos: Errores = {};
        for (const { field, message } of error.errors) campos[field as keyof Errores] ??= message;
        return { campos, general: null };
    }
    return { campos: {}, general: error.message };
}

export function AvisoFormDialog({
    open,
    aviso,
    onClose,
    onSaved,
}: {
    open: boolean;
    aviso: Aviso | null;
    onClose: () => void;
    onSaved: (aviso: Aviso, accion: 'creado' | 'actualizado') => void;
}) {
    const [original, setOriginal] = useState(() => formularioInicial(aviso));
    const [form, setForm] = useState(original);
    const [paso, setPaso] = useState<'editar' | 'vista-previa'>('editar');
    const [errores, setErrores] = useState<Errores>({});
    const [general, setGeneral] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    // Cada apertura empieza de cero con los datos del aviso (o vacío si es nuevo).
    useEffect(() => {
        if (!open) return;
        const inicial = formularioInicial(aviso);
        setOriginal(inicial);
        setForm(inicial);
        setPaso('editar');
        setErrores({});
        setGeneral(null);
    }, [open, aviso]);

    const editando = aviso !== null;
    const sinCambios = editando && Object.keys(cambios(original, form)).length === 0;
    const set = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => setForm((f) => ({ ...f, [campo]: valor }));

    function verVistaPrevia() {
        const encontrados = validar(form);
        setErrores(encontrados);
        setGeneral(null);
        if (Object.keys(encontrados).length === 0) setPaso('vista-previa');
    }

    async function publicar() {
        setEnviando(true);
        setGeneral(null);
        try {
            const guardado = aviso ? await actualizarAviso(aviso.id, cambios(original, form)) : await crearAviso(aCuerpo(form));
            onSaved(guardado, aviso ? 'actualizado' : 'creado');
        } catch (error) {
            const { campos, general: mensaje } = erroresDeApi(error);
            setErrores(campos);
            setGeneral(mensaje);
            // Con errores de campo se vuelve al formulario para corregirlos.
            if (Object.keys(campos).length > 0) setPaso('editar');
        } finally {
            setEnviando(false);
        }
    }

    const campo = (nombre: keyof Errores) => ({
        'aria-invalid': errores[nombre] ? true : undefined,
        'aria-describedby': errores[nombre] ? `error-${nombre}` : undefined,
    });
    const mensaje = (nombre: keyof Errores) =>
        errores[nombre] && (
            <p id={`error-${nombre}`} className="text-[13px] text-danger">
                {errores[nombre]}
            </p>
        );

    const footer =
        paso === 'editar' ? (
            <>
                <Button variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" form="form-aviso" disabled={sinCambios}>
                    Vista previa
                </Button>
            </>
        ) : (
            <>
                <Button variant="outline" onClick={() => setPaso('editar')} disabled={enviando}>
                    Volver a editar
                </Button>
                <Button onClick={() => void publicar()} disabled={enviando}>
                    {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar aviso'}
                </Button>
            </>
        );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={paso === 'vista-previa' ? 'Vista previa' : editando ? 'Editar aviso' : 'Nuevo aviso'}
            description={
                paso === 'vista-previa'
                    ? 'Revisa cómo se verá antes de publicarlo.'
                    : 'Los avisos públicos se ven sin iniciar sesión en las apps. Nunca incluyen datos de pacientes.'
            }
            footer={footer}
        >
            {general && (
                <Alert tone="danger" className="mb-4">
                    {general}
                </Alert>
            )}
            {paso === 'vista-previa' ? (
                <AvisoPreview aviso={aCuerpo(form)} />
            ) : (
                <form
                    id="form-aviso"
                    noValidate
                    className="grid gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        verVistaPrevia();
                    }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="aviso-titulo">Título</Label>
                        <Input
                            id="aviso-titulo"
                            maxLength={MAX_TITULO}
                            placeholder="Ej. Horario de visitas"
                            value={form.titulo}
                            onChange={(e) => set('titulo', e.target.value)}
                            {...campo('titulo')}
                        />
                        {mensaje('titulo')}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aviso-contenido">Contenido</Label>
                        <textarea
                            id="aviso-contenido"
                            rows={5}
                            maxLength={MAX_CONTENIDO}
                            className="rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-primary aria-invalid:border-danger"
                            placeholder="Horario de visitas: 2:00–6:00 p. m."
                            value={form.contenido}
                            onChange={(e) => set('contenido', e.target.value)}
                            {...campo('contenido')}
                        />
                        {mensaje('contenido')}
                    </div>
                    <div className="grid gap-2">
                        <span className="text-[13px] font-medium">Visibilidad</span>
                        <SegmentedControl
                            label="Visibilidad"
                            value={form.visibilidad}
                            onChange={(v) => set('visibilidad', v)}
                            options={[
                                { value: 'publico', label: 'Público' },
                                { value: 'interno', label: 'Interno' },
                            ]}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid content-start gap-2">
                            <Label htmlFor="aviso-desde">Visible desde</Label>
                            <Input
                                id="aviso-desde"
                                type="datetime-local"
                                value={form.publicacion}
                                onChange={(e) => set('publicacion', e.target.value)}
                                {...campo('fecha_publicacion')}
                            />
                            {mensaje('fecha_publicacion')}
                        </div>
                        <div className="grid content-start gap-2">
                            <Label htmlFor="aviso-hasta">Hasta (opcional)</Label>
                            <Input
                                id="aviso-hasta"
                                type="datetime-local"
                                min={form.publicacion || undefined}
                                value={form.expiracion}
                                onChange={(e) => set('expiracion', e.target.value)}
                                {...campo('fecha_expiracion')}
                            />
                            {mensaje('fecha_expiracion') ?? (
                                <p className="text-[13px] text-muted-foreground">Vacío: no expira.</p>
                            )}
                        </div>
                    </div>
                    {form.visibilidad === 'publico' && (
                        <Alert tone="warning">No incluyas nombres, habitaciones ni datos de pacientes en un aviso público.</Alert>
                    )}
                </form>
            )}
        </Dialog>
    );
}
