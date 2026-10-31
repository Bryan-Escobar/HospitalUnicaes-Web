import { useEffect, useId, useState, type ReactNode } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api';
import { actualizarPersonal, crearPersonal } from '@/services/personal.service';
import { ROL_ETIQUETA } from '@/types/auth.types';
import type { ActualizarPersonalBody, CrearPersonalBody, Especialidad, Personal, RolPersonal, TipoPersonal } from '@/types/personal.types';

// Las claves son los nombres de campo de la API para asociar sus errores de validación al campo.
interface Formulario {
    nombres: string;
    apellidos: string;
    codigo_empleado: string;
    tipo_personal_id: string;
    especialidad_id: string;
    telefono: string;
    num_licencia: string;
    fecha_contratacion: string;
    email: string;
    password: string;
}

type Errores = Partial<Record<keyof Formulario, string>>;

const ROLES_DE_CUENTA: RolPersonal[] = ['administrador', 'doctor', 'recepcionista'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inicial(p: Personal | null): Formulario {
    return {
        nombres: p?.nombres ?? '',
        apellidos: p?.apellidos ?? '',
        codigo_empleado: p?.codigo_empleado ?? '',
        tipo_personal_id: p?.tipo.id ?? '',
        especialidad_id: p?.especialidad?.id ?? '',
        telefono: p?.telefono ?? '',
        num_licencia: p?.num_licencia ?? '',
        fecha_contratacion: p?.fecha_contratacion ?? '',
        email: '',
        password: '',
    };
}

// Rol que recibe la cuenta según el tipo de personal; null si el tipo no admite cuenta.
function rolDelTipo(tipo: TipoPersonal | undefined): RolPersonal | null {
    const rol = tipo?.rol_sugerido;
    return rol && (ROLES_DE_CUENTA as string[]).includes(rol) ? (rol as RolPersonal) : null;
}

// Mismas reglas que personal.validator.ts de la API, para avisar antes de enviar.
function validar(f: Formulario, conCuenta: boolean, tieneCuenta: boolean, tipo: TipoPersonal | undefined): Errores {
    const e: Errores = {};
    if (!f.nombres.trim()) e.nombres = 'Escribe los nombres.';
    else if (f.nombres.trim().length > 100) e.nombres = 'Máximo 100 caracteres.';
    if (!f.apellidos.trim()) e.apellidos = 'Escribe los apellidos.';
    else if (f.apellidos.trim().length > 100) e.apellidos = 'Máximo 100 caracteres.';
    if (!f.codigo_empleado.trim()) e.codigo_empleado = 'Escribe el código de empleado.';
    else if (f.codigo_empleado.trim().length > 30) e.codigo_empleado = 'Máximo 30 caracteres.';
    if (!f.tipo_personal_id) e.tipo_personal_id = 'Elige el tipo de personal.';
    else if ((conCuenta || tieneCuenta) && !rolDelTipo(tipo)) {
        e.tipo_personal_id = 'Este tipo de personal no tiene rol de acceso: no puede tener cuenta.';
    }
    const telefono = f.telefono.trim();
    if (telefono && (telefono.length < 8 || telefono.length > 20)) e.telefono = 'Entre 8 y 20 caracteres, p. ej. +503 7000-0000.';
    if (f.num_licencia.trim().length > 50) e.num_licencia = 'Máximo 50 caracteres.';
    if (conCuenta) {
        if (!f.email.trim()) e.email = 'Escribe el correo de la cuenta.';
        else if (!EMAIL.test(f.email.trim())) e.email = 'Escribe un correo válido.';
        if (!f.password) e.password = 'Escribe una contraseña temporal.';
        else if (f.password.length < 8) e.password = 'Mínimo 8 caracteres.';
        else if (!/[a-z]/.test(f.password) || !/[A-Z]/.test(f.password) || !/\d/.test(f.password)) {
            e.password = 'Debe tener al menos una minúscula, una mayúscula y un dígito.';
        }
    }
    return e;
}

// Traduce un error de la API al campo que lo causó; lo que no tiene campo se muestra arriba del formulario.
function erroresDeApi(error: unknown): { campos: Errores; general: string | null } {
    if (!(error instanceof ApiError)) return { campos: {}, general: 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.' };
    if (error.code === 'REGISTRO_DUPLICADO') return { campos: { codigo_empleado: 'Ya existe un empleado con este código.' }, general: null };
    if (error.code === 'EMAIL_EN_USO') return { campos: { email: 'Ya existe una cuenta con este correo.' }, general: null };
    if (error.code === 'REFERENCIA_INVALIDA') return { campos: { tipo_personal_id: error.message }, general: null };
    if (error.errors.length > 0) {
        const campos: Errores = {};
        for (const { field, message } of error.errors) campos[field as keyof Formulario] ??= message;
        return { campos, general: null };
    }
    return { campos: {}, general: error.message };
}

function Campo({
    id,
    label,
    error,
    hint,
    optional,
    className,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    hint?: ReactNode;
    optional?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={className ? `grid content-start gap-2 ${className}` : 'grid content-start gap-2'}>
            <Label htmlFor={id}>
                {label}
                {optional && <span className="font-normal text-subtle-foreground">(opcional)</span>}
            </Label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="text-xs text-danger">
                    {error}
                </p>
            ) : (
                hint && (
                    <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                        {hint}
                    </p>
                )
            )}
        </div>
    );
}

// Alta y edición de un empleado. La cuenta de acceso es opcional y solo se crea en el alta.
export function PersonalFormDialog({
    open,
    personal,
    tipos,
    especialidades,
    catalogoError,
    onRetryCatalogo,
    onClose,
    onSaved,
}: {
    open: boolean;
    // null = alta de un empleado nuevo
    personal: Personal | null;
    tipos: TipoPersonal[] | undefined;
    especialidades: Especialidad[] | undefined;
    catalogoError: boolean;
    onRetryCatalogo: () => void;
    onClose: () => void;
    onSaved: (personal: Personal, accion: 'creado' | 'actualizado') => void;
}) {
    const uid = useId();
    const editando = personal !== null;
    const tieneCuenta = !!personal?.perfil_id;
    const [form, setForm] = useState<Formulario>(() => inicial(personal));
    const [conCuenta, setConCuenta] = useState(false);
    const [errores, setErrores] = useState<Errores>({});
    const [intentado, setIntentado] = useState(false);
    const [general, setGeneral] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm(inicial(personal));
        setConCuenta(false);
        setErrores({});
        setIntentado(false);
        setGeneral(null);
    }, [open, personal]);

    const tipo = tipos?.find((t) => t.id === form.tipo_personal_id);
    const rol = rolDelTipo(tipo);
    // Un tipo inactivo no se ofrece al dar de alta, pero se conserva si es el actual del empleado.
    const tiposVisibles = tipos?.filter((t) => t.activo || t.id === personal?.tipo.id) ?? [];

    const cambiar = (parcial: Partial<Formulario>) => {
        const siguiente = { ...form, ...parcial };
        setForm(siguiente);
        // Tras el primer intento de guardar, los errores se corrigen mientras se escribe.
        if (intentado) setErrores(validar(siguiente, conCuenta, tieneCuenta, tipos?.find((t) => t.id === siguiente.tipo_personal_id)));
    };

    const cambiarCuenta = (valor: boolean) => {
        setConCuenta(valor);
        if (intentado) setErrores(validar(form, valor, tieneCuenta, tipo));
    };

    const campo = (nombre: keyof Formulario) => ({
        id: `${uid}-${nombre}`,
        'aria-invalid': errores[nombre] ? true : undefined,
        'aria-describedby': errores[nombre] ? `${uid}-${nombre}-error` : `${uid}-${nombre}-hint`,
    });

    async function guardar() {
        setIntentado(true);
        setGeneral(null);
        const encontrados = validar(form, conCuenta, tieneCuenta, tipo);
        setErrores(encontrados);
        if (Object.keys(encontrados).length > 0) {
            document.getElementById(`${uid}-${Object.keys(encontrados)[0]}`)?.focus();
            return;
        }

        const datos = {
            nombres: form.nombres.trim(),
            apellidos: form.apellidos.trim(),
            codigo_empleado: form.codigo_empleado.trim(),
            tipo_personal_id: form.tipo_personal_id,
            especialidad_id: form.especialidad_id || null,
            num_licencia: form.num_licencia.trim() || null,
            fecha_contratacion: form.fecha_contratacion || null,
            ...(form.telefono.trim() && { telefono: form.telefono.trim() }),
        };

        setGuardando(true);
        try {
            if (editando) {
                const body: ActualizarPersonalBody = { ...datos };
                // Cambiar el tipo de un empleado con cuenta también le cambia el rol.
                if (tieneCuenta && rol && rol !== personal.rol) body.rol = rol;
                onSaved(await actualizarPersonal(personal.id, body), 'actualizado');
            } else {
                const body: CrearPersonalBody = conCuenta ? { ...datos, email: form.email.trim(), password: form.password } : datos;
                onSaved(await crearPersonal(body), 'creado');
            }
        } catch (error) {
            const { campos, general: mensaje } = erroresDeApi(error);
            setErrores(campos);
            setGeneral(mensaje);
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="max-w-2xl"
            title={editando ? 'Editar personal' : 'Nuevo personal'}
            description={
                editando
                    ? `${personal.nombres} ${personal.apellidos} · ${personal.codigo_empleado}`
                    : 'Registra al empleado para asignarle turnos. La cuenta de acceso es opcional.'
            }
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form={`${uid}-form`} disabled={guardando || !tipos}>
                        {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
                    </Button>
                </>
            }
        >
            <form
                id={`${uid}-form`}
                noValidate
                className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1"
                onSubmit={(e) => {
                    e.preventDefault();
                    void guardar();
                }}
            >
                {catalogoError && (
                    <Alert
                        tone="danger"
                        title="No se pudo cargar el catálogo de tipos de personal"
                        action={
                            <Button size="sm" variant="outline" onClick={onRetryCatalogo}>
                                Reintentar
                            </Button>
                        }
                    >
                        Sin el catálogo no se puede elegir el tipo ni el rol.
                    </Alert>
                )}
                {general && <Alert tone="danger">{general}</Alert>}
                {intentado && Object.keys(errores).length > 0 && !general && (
                    <Alert tone="danger">Revisa los campos marcados antes de guardar.</Alert>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Campo id={`${uid}-nombres`} label="Nombres" error={errores.nombres}>
                        <Input {...campo('nombres')} autoComplete="off" value={form.nombres} onChange={(e) => cambiar({ nombres: e.target.value })} />
                    </Campo>
                    <Campo id={`${uid}-apellidos`} label="Apellidos" error={errores.apellidos}>
                        <Input {...campo('apellidos')} autoComplete="off" value={form.apellidos} onChange={(e) => cambiar({ apellidos: e.target.value })} />
                    </Campo>
                    <Campo id={`${uid}-tipo_personal_id`} label="Tipo de personal" error={errores.tipo_personal_id}>
                        <Select
                            {...campo('tipo_personal_id')}
                            className="w-full"
                            value={form.tipo_personal_id}
                            disabled={!tipos}
                            onChange={(e) => cambiar({ tipo_personal_id: e.target.value })}
                        >
                            <option value="">{tipos ? 'Elige un tipo' : 'Cargando…'}</option>
                            {tiposVisibles.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nombre}
                                </option>
                            ))}
                        </Select>
                    </Campo>
                    <Campo id={`${uid}-codigo_empleado`} label="Código de empleado" error={errores.codigo_empleado}>
                        <Input
                            {...campo('codigo_empleado')}
                            placeholder="EMP-0042"
                            autoComplete="off"
                            value={form.codigo_empleado}
                            onChange={(e) => cambiar({ codigo_empleado: e.target.value })}
                        />
                    </Campo>
                    <Campo id={`${uid}-especialidad_id`} label="Especialidad" optional error={errores.especialidad_id}>
                        <Select
                            {...campo('especialidad_id')}
                            className="w-full"
                            value={form.especialidad_id}
                            onChange={(e) => cambiar({ especialidad_id: e.target.value })}
                        >
                            <option value="">Sin especialidad</option>
                            {especialidades?.map((esp) => (
                                <option key={esp.id} value={esp.id}>
                                    {esp.nombre}
                                </option>
                            ))}
                        </Select>
                    </Campo>
                    <Campo id={`${uid}-num_licencia`} label="N.º de licencia" optional error={errores.num_licencia}>
                        <Input
                            {...campo('num_licencia')}
                            placeholder="JVPM-12345"
                            autoComplete="off"
                            value={form.num_licencia}
                            onChange={(e) => cambiar({ num_licencia: e.target.value })}
                        />
                    </Campo>
                    <Campo id={`${uid}-telefono`} label="Teléfono" optional error={errores.telefono}>
                        <Input
                            {...campo('telefono')}
                            type="tel"
                            placeholder="+503 7000-0000"
                            value={form.telefono}
                            onChange={(e) => cambiar({ telefono: e.target.value })}
                        />
                    </Campo>
                    <Campo id={`${uid}-fecha_contratacion`} label="Fecha de contratación" optional error={errores.fecha_contratacion}>
                        <Input
                            {...campo('fecha_contratacion')}
                            type="date"
                            value={form.fecha_contratacion}
                            onChange={(e) => cambiar({ fecha_contratacion: e.target.value })}
                        />
                    </Campo>
                </div>

                <section aria-label="Cuenta de acceso" className="grid gap-4 rounded-lg border border-border p-4">
                    {editando ? (
                        tieneCuenta ? (
                            <p className="flex items-start gap-3 text-sm">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                                <span>
                                    Cuenta <strong className="font-semibold">{personal.email}</strong> con rol{' '}
                                    <strong className="font-semibold">{rol ? ROL_ETIQUETA[rol] : '—'}</strong>
                                    {rol && rol !== personal.rol && ' (cambia con el tipo de personal)'}.
                                </span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Este empleado no tiene cuenta de acceso: solo aparece en turnos.</p>
                        )
                    ) : (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <Label htmlFor={`${uid}-cuenta`}>Crear cuenta de acceso</Label>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {conCuenta
                                            ? 'Podrá iniciar sesión en la app que corresponde a su rol.'
                                            : 'Sin cuenta, el empleado solo aparece en turnos.'}
                                    </p>
                                </div>
                                <Switch id={`${uid}-cuenta`} checked={conCuenta} onCheckedChange={cambiarCuenta} />
                            </div>
                            {conCuenta && (
                                <>
                                    <p className="flex items-center gap-2 text-sm">
                                        <KeyRound className="size-4 text-primary" />
                                        Rol asignado:{' '}
                                        <strong className="font-semibold">
                                            {rol ? ROL_ETIQUETA[rol] : tipo ? 'este tipo no admite cuenta' : 'elige el tipo de personal'}
                                        </strong>
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Campo id={`${uid}-email`} label="Correo" error={errores.email}>
                                            <Input
                                                {...campo('email')}
                                                type="email"
                                                autoComplete="off"
                                                placeholder="ana.lopez@hospital.edu"
                                                value={form.email}
                                                onChange={(e) => cambiar({ email: e.target.value })}
                                            />
                                        </Campo>
                                        <Campo
                                            id={`${uid}-password`}
                                            label="Contraseña temporal"
                                            error={errores.password}
                                            hint="Mínimo 8 caracteres con mayúscula, minúscula y dígito."
                                        >
                                            <Input
                                                {...campo('password')}
                                                type="password"
                                                autoComplete="new-password"
                                                value={form.password}
                                                onChange={(e) => cambiar({ password: e.target.value })}
                                            />
                                        </Campo>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </section>
            </form>
        </Dialog>
    );
}
