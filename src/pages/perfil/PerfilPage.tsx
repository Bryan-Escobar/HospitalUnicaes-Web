import { useContext, useState, type FormEvent, type ReactNode } from 'react';
import { Check, LoaderCircle, Lock, LogOut } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { AuthContext, type AuthContextProps } from '@/context/AuthContext';
import { useAlertasPanel } from '@/hooks/useAlertasPanel';
import { useTheme, type Tema } from '@/hooks/useTheme';
import { isDemoMode, supabase } from '@/lib/client';
import { ROL_ETIQUETA, type Me } from '@/types/auth.types';
import { CambiarPasswordDialog } from './CambiarPasswordDialog';

function Fila({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
            <p className="text-sm font-semibold">{title}</p>
            {children}
        </div>
    );
}

type DatosEditables = Pick<Me, 'nombres' | 'apellidos' | 'telefono'>;

function DatosPerfil({ perfil, correo, guardarPerfil }: {
    perfil: Me;
    correo: string;
    guardarPerfil: AuthContextProps['guardarPerfil'];
}) {
    const [edicion, setEdicion] = useState<Partial<DatosEditables>>({});
    const [guardando, setGuardando] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [error, setError] = useState('');
    const nombre = `${perfil.nombres} ${perfil.apellidos}`.trim() || correo || 'Mi perfil';

    function editar(campo: keyof DatosEditables, valor: string) {
        setEdicion((anterior) => ({ ...anterior, [campo]: valor }));
        setGuardado(false);
        setError('');
    }

    async function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (guardando || isDemoMode) return;
        const cambios: Partial<DatosEditables> = {};
        const nombres = edicion.nombres?.trim();
        const apellidos = edicion.apellidos?.trim();
        const telefono = edicion.telefono?.trim() || null;
        if (nombres !== undefined && nombres !== perfil.nombres) cambios.nombres = nombres;
        if (apellidos !== undefined && apellidos !== perfil.apellidos) cambios.apellidos = apellidos;
        if (edicion.telefono !== undefined && telefono !== perfil.telefono) cambios.telefono = telefono;
        if (Object.keys(cambios).length === 0) {
            setEdicion({});
            return;
        }
        if (cambios.nombres === '' || cambios.apellidos === '') {
            setError('Escribe tus nombres y apellidos.');
            return;
        }
        if (cambios.telefono && cambios.telefono.length < 8) {
            setError('El teléfono debe tener al menos 8 caracteres.');
            return;
        }
        setGuardando(true);
        setError('');
        try {
            await guardarPerfil(cambios);
            setEdicion({});
            setGuardado(true);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Card>
            <CardContent className="pt-5">
                <div className="mb-6 flex items-center gap-4">
                    <Avatar name={nombre} src={perfil.avatar_url ?? undefined} size="lg" />
                    <div className="min-w-0">
                        <p className="text-xl font-semibold break-words">{nombre}</p>
                        <p className="text-sm text-muted-foreground">
                            {ROL_ETIQUETA[perfil.rol]}
                            {perfil.personal?.tipo?.nombre && ` · ${perfil.personal.tipo.nombre}`}
                        </p>
                    </div>
                </div>
                <form onSubmit={guardar}>
                    <fieldset disabled={guardando} className="grid gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="perfil-nombres">Nombres</Label>
                                <Input id="perfil-nombres" autoComplete="given-name" maxLength={100} readOnly={isDemoMode}
                                    value={edicion.nombres ?? perfil.nombres} onChange={(e) => editar('nombres', e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="perfil-apellidos">Apellidos</Label>
                                <Input id="perfil-apellidos" autoComplete="family-name" maxLength={100} readOnly={isDemoMode}
                                    value={edicion.apellidos ?? perfil.apellidos} onChange={(e) => editar('apellidos', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="perfil-correo">Correo de la cuenta</Label>
                            <Input id="perfil-correo" type="email" value={correo} readOnly />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="perfil-telefono">Teléfono</Label>
                            <Input id="perfil-telefono" type="tel" autoComplete="tel" maxLength={20} readOnly={isDemoMode}
                                value={edicion.telefono ?? perfil.telefono ?? ''} onChange={(e) => editar('telefono', e.target.value)} />
                        </div>
                        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                        {!isDemoMode && (
                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="submit" disabled={guardando || Object.keys(edicion).length === 0}>
                                    {guardando && <LoaderCircle className="animate-spin" />}
                                    Guardar cambios
                                </Button>
                                {guardado && (
                                    <span role="status" className="flex items-center gap-1.5 text-sm text-success-ink">
                                        <Check className="size-4" /> Cambios guardados
                                    </span>
                                )}
                            </div>
                        )}
                    </fieldset>
                </form>
            </CardContent>
        </Card>
    );
}

function Preferencias({ userId }: { userId: string }) {
    const [tema, setTema] = useTheme();
    const [alertas, guardarAlerta] = useAlertasPanel(userId);
    const [error, setError] = useState(false);

    function cambiarAlerta(alerta: keyof typeof alertas, activa: boolean) {
        try {
            guardarAlerta(alerta, activa);
            setError(false);
        } catch {
            setError(true);
        }
    }

    return (
        <Card>
            <CardHeader title="Preferencias" description="Se guardan en este navegador." />
            <CardContent className="pt-2">
                <Fila title="Tema">
                    <SegmentedControl<Tema>
                        label="Tema"
                        value={tema}
                        onChange={setTema}
                        options={[
                            { value: 'claro', label: 'Claro' },
                            { value: 'oscuro', label: 'Oscuro' },
                            { value: 'sistema', label: 'Sistema' },
                        ]}
                    />
                </Fila>
                <Fila title="Solicitudes de ambulancia en el dashboard">
                    <Switch aria-label="Solicitudes de ambulancia en el dashboard" checked={alertas.ambulancia}
                        onCheckedChange={(activa) => cambiarAlerta('ambulancia', activa)} />
                </Fila>
                <Fila title="Alertas de stock bajo en el dashboard">
                    <Switch aria-label="Alertas de stock bajo en el dashboard" checked={alertas.stock}
                        onCheckedChange={(activa) => cambiarAlerta('stock', activa)} />
                </Fila>
                {error && <p role="alert" className="mt-2 text-sm text-danger">No se pudo guardar la preferencia.</p>}
            </CardContent>
        </Card>
    );
}

function Seguridad({ logOut }: { logOut: AuthContextProps['logOut'] }) {
    const [passwordAbierto, setPasswordAbierto] = useState(false);
    const [accion, setAccion] = useState<'actual' | 'otras' | null>(null);
    const [aviso, setAviso] = useState<{ error: boolean; texto: string } | null>(null);

    async function cerrarSesion(alcance: 'actual' | 'otras') {
        setAccion(alcance);
        setAviso(null);
        try {
            if (alcance === 'actual') {
                await logOut();
            } else {
                const { error } = await supabase.auth.signOut({ scope: 'others' });
                if (error) throw error;
                setAviso({ error: false, texto: 'Se cerraron las otras sesiones.' });
            }
        } catch {
            setAviso({ error: true, texto: alcance === 'actual'
                ? 'No se pudo cerrar la sesión. Intenta de nuevo.'
                : 'No se pudieron cerrar las otras sesiones. Intenta de nuevo.' });
        } finally {
            setAccion(null);
        }
    }

    return (
        <Card>
            <CardHeader title="Seguridad" />
            <CardContent className="pt-2">
                {!isDemoMode && (
                    <>
                        <Fila title="Contraseña">
                            <Button variant="outline" disabled={accion !== null} onClick={() => setPasswordAbierto(true)}>
                                <Lock /> Cambiar contraseña
                            </Button>
                        </Fila>
                        <Fila title="Otros dispositivos">
                            <Button variant="outline" disabled={accion !== null} onClick={() => cerrarSesion('otras')}>
                                {accion === 'otras' && <LoaderCircle className="animate-spin" />}
                                Cerrar otras sesiones
                            </Button>
                        </Fila>
                    </>
                )}
                <Fila title="Este navegador">
                    <Button variant="outline" disabled={accion !== null} onClick={() => cerrarSesion('actual')}>
                        {accion === 'actual' ? <LoaderCircle className="animate-spin" /> : <LogOut />}
                        Cerrar sesión
                    </Button>
                </Fila>
                {aviso && <p role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'mt-2 text-sm text-danger' : 'mt-2 text-sm text-success-ink'}>{aviso.texto}</p>}
            </CardContent>
            {passwordAbierto && (
                <CambiarPasswordDialog onClose={() => setPasswordAbierto(false)} onSave={() => {
                    setPasswordAbierto(false);
                    setAviso({ error: false, texto: 'Contraseña actualizada.' });
                }} />
            )}
        </Card>
    );
}

export default function PerfilPage() {
    const { acceso, session, guardarPerfil, logOut } = useContext(AuthContext);
    if (acceso?.estado !== 'permitido') return null;
    const { perfil, userId } = acceso;

    return (
        <>
            <PageHeader title="Perfil y configuración" subtitle={isDemoMode ? 'Estás en modo demostración.' : undefined} />
            <div key={userId} className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <DatosPerfil perfil={perfil} correo={perfil.email ?? session?.user.email ?? ''} guardarPerfil={guardarPerfil} />
                <div className="grid gap-4">
                    <Seguridad logOut={logOut} />
                    <Preferencias userId={userId} />
                </div>
            </div>
        </>
    );
}
