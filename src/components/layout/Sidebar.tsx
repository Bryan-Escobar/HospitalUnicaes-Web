import { NavLink } from 'react-router-dom';
import {
    Ambulance,
    BedDouble,
    ChartColumn,
    CircleUserRound,
    ClipboardList,
    Clock,
    FlaskConical,
    IdCard,
    LayoutGrid,
    Megaphone,
    Package,
    Users,
    type LucideIcon,
} from 'lucide-react';

import { Brand } from '@/components/layout/BrandMark';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/usuarios', label: 'Usuarios y personal', icon: IdCard },
    { to: '/pacientes', label: 'Pacientes', icon: Users },
    { to: '/turnos', label: 'Turnos', icon: Clock },
    { to: '/mapa-plantas', label: 'Mapa de plantas', icon: BedDouble },
    { to: '/inventario', label: 'Inventario y recursos', icon: Package },
    { to: '/laboratorio', label: 'Laboratorio', icon: FlaskConical },
    { to: '/ambulancia', label: 'Ambulancia', icon: Ambulance },
    { to: '/bitacora', label: 'Bitácora', icon: ClipboardList },
    { to: '/avisos', label: 'Avisos', icon: Megaphone },
    { to: '/reportes', label: 'Reportes y métricas', icon: ChartColumn },
];

function SidebarLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground transition-colors hover:bg-white/5 hover:text-white',
                    isActive && 'bg-sidebar-active font-semibold text-white hover:bg-sidebar-active',
                )
            }
        >
            {({ isActive }) => (
                <>
                    {/* Indicador oro de la marca en el ítem activo */}
                    {isActive && <span aria-hidden className="absolute top-1 bottom-1 -left-3 w-1 rounded-r bg-oro-400" />}
                    <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{label}</span>
                </>
            )}
        </NavLink>
    );
}

export function Sidebar() {
    return (
        <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-t-[3px] border-oro-400 bg-sidebar">
            <div className="px-3 pt-4 pb-5">
                <Brand />
            </div>
            <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
                {NAV_ITEMS.map((item) => (
                    <SidebarLink key={item.to} {...item} />
                ))}
            </nav>
            <div className="px-3 pb-3">
                <div className="mb-2 border-t border-sidebar-border" />
                <SidebarLink to="/perfil" label="Perfil" icon={CircleUserRound} />
                <p className="mt-2 px-1 text-[11px] text-oro-400">Hospital Universitario · UNICAES</p>
            </div>
        </aside>
    );
}
