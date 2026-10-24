import { useContext, useEffect, useState } from 'react';
import { Check, LoaderCircle, Lock, LogOut } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/feedback-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { AuthContext } from '@/context/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useTheme, type Tema } from '@/hooks/useTheme';
import { obtenerPerfil } from '@/services/admin.service';

function Fila({ title, detail, children }: { title: string; detail?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
            <div>
                <p className="text-sm font-semibold">{title}</p>
                {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
            </div>
            {children}
        </div>
    );
}

// WEB-13 Perfil y configuración.
export default function PerfilPage() {
    const { logOut } = useContext(AuthContext);
    const perfil = useResource(obtenerPerfil);
    const [tema, setTema] = useTheme();
    const [notificarAmbulancia, setNotificarAmbulancia] = useState(true);
    const [alertasStock, setAlertasStock] = useState(true);
    const [form, setForm] = useState({ nombre: '', correo: '', telefono: '' });
    const [guardado, setGuardado] = useState<'idle' | 'guardando' | 'ok'>('idle');

    useEffect(() => {
        if (perfil.data) setForm({ nombre: perfil.data.nombre, correo: perfil.data.correo, telefono: perfil.data.telefono });
    }, [perfil.data]);

    const guardar = (e: React.FormEvent) => {
        e.preventDefault();
        setGuardado('guardando');
        setTimeout(() => setGuardado('ok'), 600);
    };

    return (
        <>
            <PageHeader title="Perfil y configuración" />
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-4">
                <Card>
                    {perfil.status === 'loading' && (
                        <CardContent className="space-y-5 pt-5" aria-hidden>
                            <div className="flex items-center gap-4">
                                <Skeleton className="size-16 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                            </div>
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            ))}
                        </CardContent>
                    )}
                    {perfil.status === 'error' && <ErrorState title="No se pudo cargar tu perfil" onRetry={perfil.refetch} />}
                    {perfil.data && perfil.status !== 'loading' && perfil.status !== 'error' && (
                        <CardContent className="pt-5">
                            <div className="mb-6 flex items-center gap-4">
                                <Avatar name={perfil.data.nombre} size="lg" />
                                <div>
                                    <p className="text-xl font-semibold">{perfil.data.nombre}</p>
                                    <p className="text-sm text-muted-foreground">{perfil.data.cargo}</p>
                                </div>
                            </div>
                            <form className="grid gap-5" onSubmit={guardar} onChange={() => setGuardado('idle')}>
                                <div className="grid gap-2">
                                    <Label htmlFor="perfil-nombre">Nombre</Label>
                                    <Input id="perfil-nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="perfil-correo">Correo</Label>
                                    <Input id="perfil-correo" type="email" required value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="perfil-telefono">Teléfono</Label>
                                    <Input
                                        id="perfil-telefono"
                                        inputMode="tel"
                                        pattern="\d{4}-\d{4}"
                                        title="Formato 0000-0000"
                                        value={form.telefono}
                                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={guardado === 'guardando'}>
                                        {guardado === 'guardando' && <LoaderCircle className="animate-spin" />}
                                        Guardar cambios
                                    </Button>
                                    {guardado === 'ok' && (
                                        <span role="status" className="flex items-center gap-1.5 text-sm text-success-ink">
                                            <Check className="size-4" /> Cambios guardados
                                        </span>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    )}
                </Card>

                <div className="grid gap-4">
                    <Card>
                        <CardHeader title="Seguridad" />
                        <CardContent className="pt-2">
                            <Fila title="Contraseña" detail={perfil.data?.passwordCambiada}>
                                <Button variant="outline">
                                    <Lock /> Cambiar contraseña
                                </Button>
                            </Fila>
                            <Fila title={`Sesiones activas: ${perfil.data?.sesionesActivas ?? '—'}`} detail="este navegador">
                                <Button variant="outline">Cerrar otras sesiones</Button>
                            </Fila>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader title="Preferencias" />
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
                            <Fila title="Notificar solicitudes de ambulancia">
                                <Switch
                                    aria-label="Notificar solicitudes de ambulancia"
                                    checked={notificarAmbulancia}
                                    onCheckedChange={setNotificarAmbulancia}
                                />
                            </Fila>
                            <Fila title="Alertas de stock bajo">
                                <Switch aria-label="Alertas de stock bajo" checked={alertasStock} onCheckedChange={setAlertasStock} />
                            </Fila>
                        </CardContent>
                    </Card>
                    <div>
                        <Button variant="outline" onClick={logOut}>
                            <LogOut /> Cerrar sesión
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
