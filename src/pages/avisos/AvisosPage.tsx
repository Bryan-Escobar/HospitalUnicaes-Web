import { useState } from 'react';
import { Globe, Lock, Megaphone, Plus } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { listarAvisos, type FiltroAvisos } from '@/services/admin.service';
import type { Aviso } from '@/types/admin.types';

const FILTROS: { value: FiltroAvisos; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'vigente', label: 'Vigentes' },
    { value: 'programado', label: 'Programados' },
    { value: 'vencido', label: 'Vencidos' },
    { value: 'publicos', label: 'Públicos' },
    { value: 'internos', label: 'Internos' },
];

const columnas: Column<Aviso>[] = [
    { header: 'Título', cell: (a) => <span className="font-semibold">{a.titulo}</span>, skeleton: 'w-48', className: 'w-[36%]' },
    {
        header: 'Visibilidad',
        cell: (a) =>
            a.publico ? (
                <Badge tone="primary">
                    <Globe className="size-3" aria-hidden /> Público
                </Badge>
            ) : (
                <Badge>
                    <Lock className="size-3" aria-hidden /> Interno
                </Badge>
            ),
    },
    { header: 'Vigencia', cell: (a) => a.vigencia, skeleton: 'w-28' },
    { header: 'Estado', cell: (a) => <StatusBadge estado={a.estado} /> },
    {
        header: '',
        className: 'text-right w-36',
        cell: () => (
            <span className="inline-flex items-center gap-1.5">
                <Button variant="link" size="sm">
                    Editar
                </Button>
                <span aria-hidden className="text-muted-foreground">·</span>
                <Button variant="link-danger" size="sm">
                    Eliminar
                </Button>
            </span>
        ),
    },
];

function NuevoAvisoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [visibilidad, setVisibilidad] = useState<'publico' | 'interno'>('publico');
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="Nuevo aviso"
            description="Los avisos públicos se ven sin iniciar sesión en la app iOS."
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-aviso">
                        Publicar aviso
                    </Button>
                </>
            }
        >
            <form
                id="form-aviso"
                className="grid gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    onClose();
                }}
            >
                <div className="grid gap-2">
                    <Label htmlFor="aviso-titulo">Título</Label>
                    <Input id="aviso-titulo" required placeholder="Ej. Horario de visitas" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="aviso-contenido">Contenido</Label>
                    <textarea
                        id="aviso-contenido"
                        required
                        rows={4}
                        className="rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-primary"
                        placeholder="Horario de visitas: 2:00–6:00 p. m."
                    />
                </div>
                <div className="grid gap-2">
                    <span className="text-[13px] font-medium">Visibilidad</span>
                    <SegmentedControl
                        label="Visibilidad"
                        value={visibilidad}
                        onChange={setVisibilidad}
                        options={[
                            { value: 'publico', label: 'Público' },
                            { value: 'interno', label: 'Interno' },
                        ]}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="aviso-desde">Vigente desde</Label>
                        <Input id="aviso-desde" type="date" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aviso-hasta">Hasta</Label>
                        <Input id="aviso-hasta" type="date" />
                    </div>
                </div>
                {visibilidad === 'publico' && (
                    <Alert tone="warning">No incluyas nombres, habitaciones ni datos de pacientes en un aviso público.</Alert>
                )}
            </form>
        </Dialog>
    );
}

// WEB-11 Avisos: avisos públicos (app iOS sin sesión) e internos.
export default function AvisosPage() {
    const [filtro, setFiltro] = useState<FiltroAvisos>('todos');
    const [nuevo, setNuevo] = useState(false);
    const avisos = useResource(() => listarAvisos(filtro), [filtro]);

    return (
        <>
            <PageHeader
                title="Avisos"
                subtitle="Los avisos públicos se muestran sin sesión en la app iOS. Nunca incluyen datos de pacientes."
                actions={
                    <Button onClick={() => setNuevo(true)}>
                        <Plus /> Nuevo aviso
                    </Button>
                }
            />
            <Toolbar>
                <div role="group" aria-label="Filtrar avisos" className="flex flex-wrap gap-2">
                    {FILTROS.map((f) => (
                        <FilterChip key={f.value} selected={filtro === f.value} onClick={() => setFiltro(f.value)}>
                            {f.label}
                        </FilterChip>
                    ))}
                </div>
            </Toolbar>
            <DataTable
                label="Avisos"
                columns={columnas}
                rows={avisos.data}
                status={avisos.status}
                rowKey={(a) => a.id}
                onRetry={avisos.refetch}
                skeletonRows={4}
                empty={{
                    icon: Megaphone,
                    title: filtro === 'todos' ? 'No hay avisos publicados' : 'No hay avisos en este filtro',
                    description:
                        filtro === 'todos'
                            ? 'Publica horarios de visita, jornadas o comunicados internos para el personal.'
                            : 'Prueba con otro filtro.',
                    action:
                        filtro === 'todos' ? (
                            <Button onClick={() => setNuevo(true)}>
                                <Plus /> Nuevo aviso
                            </Button>
                        ) : undefined,
                }}
            />
            <NuevoAvisoDialog open={nuevo} onClose={() => setNuevo(false)} />
        </>
    );
}
