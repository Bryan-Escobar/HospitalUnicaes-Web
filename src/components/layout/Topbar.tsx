import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { LiveIndicator } from '@/components/layout/LiveIndicator';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/input';
import { AuthContext } from '@/context/AuthContext';
import { isDemoMode } from '@/lib/client';
import { useDemoStore, type DemoMode } from '@/store/useDemoStore';
import { ROL_ETIQUETA } from '@/types/auth.types';

const showStatePreview = import.meta.env.DEV || isDemoMode;

function DemoStatePicker() {
    const mode = useDemoStore((s) => s.mode);
    const setMode = useDemoStore((s) => s.setMode);
    return (
        <label className="flex items-center gap-2 rounded-md border border-dashed border-border-strong px-2 py-1 text-xs whitespace-nowrap text-muted-foreground">
            Vista previa
            <select
                value={mode}
                onChange={(e) => setMode(e.target.value as DemoMode)}
                className="cursor-pointer rounded-sm bg-transparent font-medium text-foreground outline-none"
                aria-label="Estado de los datos (vista previa)"
            >
                <option value="datos">Con datos</option>
                <option value="carga">Cargando</option>
                <option value="vacio">Vacío</option>
                <option value="error">Error</option>
            </select>
        </label>
    );
}

export function Topbar() {
    const navigate = useNavigate();
    const { acceso, session } = useContext(AuthContext);
    const [q, setQ] = useState('');
    const perfil = acceso?.estado === 'permitido' ? acceso.perfil : null;
    const nombre = `${perfil?.nombres ?? ''} ${perfil?.apellidos ?? ''}`.trim() || perfil?.email || session?.user.email || 'Mi perfil';

    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-7">
            <form
                role="search"
                className="min-w-0 flex-1 basis-[420px] max-w-[420px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    navigate('/pacientes', { state: { busqueda: q } });
                }}
            >
                <SearchInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar paciente"
                    aria-label="Buscar paciente"
                />
            </form>
            <div className="ml-auto flex shrink-0 items-center gap-4">
                {showStatePreview && <DemoStatePicker />}
                <LiveIndicator />
                <Link to="/perfil" className="flex min-w-0 items-center gap-3 rounded-md">
                    <Avatar name={nombre} src={perfil?.avatar_url ?? undefined} />
                    <div className="min-w-0 leading-tight">
                        <p className="max-w-40 truncate text-sm font-semibold 2xl:max-w-72">{nombre}</p>
                        {perfil && <p className="text-xs text-muted-foreground">{ROL_ETIQUETA[perfil.rol]}</p>}
                    </div>
                </Link>
            </div>
        </header>
    );
}
