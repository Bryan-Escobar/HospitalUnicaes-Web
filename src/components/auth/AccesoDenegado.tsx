import { useContext, useState } from 'react';
import { CloudOff, LoaderCircle, LogOut, RotateCw, ShieldX, UserX } from 'lucide-react';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/context/AuthContext';
import { ROL_ETIQUETA, type EstadoAcceso } from '@/types/auth.types';

// Sesión válida pero sin permiso para el panel: otro rol, cuenta desactivada o la API no respondió.
export function AccesoDenegado({ acceso }: { acceso: Exclude<EstadoAcceso, { estado: 'permitido' }> }) {
    const { session, logOut, reintentarAcceso } = useContext(AuthContext);
    const [saliendo, setSaliendo] = useState(false);
    const correo = session?.user?.email;

    const contenido = {
        denegado: {
            icon: ShieldX,
            titulo: 'Acceso denegado',
            texto: (
                <>
                    El panel Web es solo para el rol Administrador
                    {acceso.estado === 'denegado' && acceso.perfil && (
                        <>
                            {' '}y tu cuenta tiene el rol <strong className="text-foreground">{ROL_ETIQUETA[acceso.perfil.rol]}</strong>
                        </>
                    )}
                    . Usa la app móvil de tu rol o inicia sesión con una cuenta de administrador.
                </>
            ),
        },
        inactivo: {
            icon: UserX,
            titulo: 'Cuenta desactivada',
            texto: 'Tu cuenta está desactivada. Contacta a la administración del hospital para reactivarla.',
        },
        incompleto: {
            icon: UserX,
            titulo: 'Perfil incompleto',
            texto: 'Tu cuenta existe pero no tiene un registro de personal asociado. Pide a la administración que lo complete e intenta de nuevo.',
        },
        error: {
            icon: CloudOff,
            titulo: 'No se pudo verificar tu cuenta',
            texto: acceso.estado === 'error' ? acceso.mensaje : '',
        },
    }[acceso.estado];
    const Icon = contenido.icon;
    // Tras arreglar el dato (o la red) se puede volver a verificar sin cerrar sesión
    const puedeReintentar = acceso.estado === 'error' || acceso.estado === 'incompleto';

    const salir = async () => {
        setSaliendo(true);
        await logOut();
    };

    return (
        <AuthShell>
            <div role="alert">
                <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <Icon className="size-6" />
                </span>
                <h1 className="mt-5 text-2xl leading-8 font-semibold">{contenido.titulo}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{contenido.texto}</p>
                {correo && (
                    <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">
                        Sesión iniciada como <span className="font-medium">{correo}</span>
                    </p>
                )}
            </div>
            <div className="mt-6 flex flex-col gap-3">
                {puedeReintentar && (
                    <Button onClick={reintentarAcceso}>
                        <RotateCw />
                        Reintentar
                    </Button>
                )}
                <Button variant={puedeReintentar ? 'outline' : 'default'} onClick={salir} disabled={saliendo}>
                    {saliendo ? <LoaderCircle className="animate-spin" /> : <LogOut />}
                    {acceso.estado === 'error' ? 'Cerrar sesión' : 'Usar otra cuenta'}
                </Button>
            </div>
        </AuthShell>
    );
}
