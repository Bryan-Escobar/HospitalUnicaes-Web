import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LiveIndicator } from '@/components/layout/LiveIndicator';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput } from '@/components/ui/input';
import { AuthContext } from '@/context/AuthContext';
import { isDemoMode } from '@/lib/client';
import { perfilActual } from '@/services/admin.service';
import { useDemoStore, type DemoMode } from '@/store/useDemoStore';

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
    const { acceso } = useContext(AuthContext);
    const [q, setQ] = useState('');
    // Nombre del perfil de la sesión (GET /auth/me); el cargo aún viene de los datos de ejemplo
    const perfil = acceso?.estado === 'permitido' ? acceso.perfil : null;
    const nombre = perfil ? `${perfil.nombres} ${perfil.apellidos}`.trim() : perfilActual.nombre;

    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card px-7">
            <form
                role="search"
                className="min-w-0 flex-1 basis-[420px] max-w-[420px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    navigate(`/pacientes?q=${encodeURIComponent(q)}`);
                }}
            >
                <SearchInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar paciente, personal o habitación"
                    aria-label="Buscar paciente, personal o habitación"
                />
            </form>
            <div className="ml-auto flex shrink-0 items-center gap-4">
                {showStatePreview && <DemoStatePicker />}
                <LiveIndicator />
                <div className="flex items-center gap-3">
                    <Avatar name={nombre} />
                    <div className="leading-tight whitespace-nowrap">
                        <p className="text-sm font-semibold">{nombre}</p>
                        {/* A 1280 px solo cabe el rol; el cargo completo se muestra en pantallas anchas */}
                        <p className="text-xs text-muted-foreground">
                            <span className="2xl:hidden">Administrador</span>
                            <span className="hidden 2xl:inline">{perfilActual.cargo}</span>
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}
