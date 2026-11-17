import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/feedback-state';
import { SearchInput } from '@/components/ui/input';
import { isDemoMode } from '@/lib/client';
import { listarPacientes, PACIENTES_POR_PAGINA } from '@/services/pacientes.service';
import type { PacienteListado } from '@/types/pacientes.types';

export function SeleccionPaciente({ paciente, onSelect, ocupantes, usuario, vista }: {
    paciente: PacienteListado | null;
    onSelect: (paciente: PacienteListado | null) => void;
    ocupantes: Set<string>;
    usuario: string | undefined;
    vista: string | undefined;
}) {
    const [busqueda, setBusqueda] = useState('');
    const [page, setPage] = useState(1);
    const resultado = useQuery({
        queryKey: ['mapa-plantas-pacientes', usuario, vista, busqueda.trim(), page],
        queryFn: () => listarPacientes({
            busqueda: busqueda.trim(), page, estado: 'activos', hospitalizacion: isDemoMode ? 'todas' : 'ambulatorios',
        }),
        enabled: !paciente,
        refetchOnMount: 'always',
    });

    if (paciente) {
        return (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
                <span>
                    {paciente.nombres} {paciente.apellidos}
                    {paciente.documento_identidad && <span className="block text-xs text-muted-foreground">{paciente.documento_identidad}</span>}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => { setPage(1); onSelect(null); }}>
                    Cambiar paciente
                </Button>
            </div>
        );
    }

    const pacientes = resultado.data?.items.filter((p) => !ocupantes.has(p.id)) ?? [];
    return (
        <div className="space-y-2">
            <SearchInput
                aria-label="Buscar paciente"
                placeholder="Buscar por nombre o DUI"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.preventDefault(); }}
            />
            {resultado.isPending && <p role="status" className="text-sm text-muted-foreground">Buscando pacientes…</p>}
            {resultado.isError && <ErrorState compact title="No se pudieron cargar los pacientes" onRetry={() => void resultado.refetch()} />}
            {resultado.isSuccess && pacientes.length === 0 && (
                <p role="status" className="text-sm text-muted-foreground">No hay pacientes disponibles en esta página.</p>
            )}
            {pacientes.length > 0 && (
                <ul className="max-h-32 divide-y divide-border overflow-y-auto rounded-md border border-border">
                    {pacientes.map((p) => (
                        <li key={p.id}>
                            <Button type="button" variant="ghost" className="h-auto w-full justify-between gap-2 whitespace-normal text-left" onClick={() => onSelect(p)}>
                                <span>{p.nombres} {p.apellidos}</span>
                                {p.documento_identidad && <span className="shrink-0 text-xs text-muted-foreground">{p.documento_identidad}</span>}
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
            {(page > 1 || (resultado.data?.total ?? 0) > PACIENTES_POR_PAGINA) && (
                <div className="flex items-center justify-between gap-2 text-sm">
                    <Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
                    <span>Página {page}</span>
                    <Button type="button" size="sm" variant="outline" disabled={page * PACIENTES_POR_PAGINA >= (resultado.data?.total ?? 0)} onClick={() => setPage(page + 1)}>Siguiente</Button>
                </div>
            )}
        </div>
    );
}
