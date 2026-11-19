import { useState } from 'react';
import { BedSingle, ChevronRight } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/ui/feedback-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { isDemoMode } from '@/lib/client';
import { cn } from '@/lib/utils';
import type { Cama, EstadoCama, Habitacion } from '@/types/habitaciones.types';

import { GestionCamaDialog } from './GestionCamaDialog';
import { useMapaPlantas } from './useMapaPlantas';

const PLANTAS = [
    { numero: 3, nombre: 'VIP', habitaciones: 5, columnas: 'sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5' },
    { numero: 2, nombre: 'Semiprivadas', habitaciones: 6, columnas: 'md:grid-cols-2 xl:grid-cols-3' },
] as const;

const ESTADOS: Record<EstadoCama, { etiqueta: string; estilo: string }> = {
    disponible: { etiqueta: 'Libre', estilo: 'border-success-ink/30 bg-success-soft text-success-ink' },
    ocupada: { etiqueta: 'Ocupada', estilo: 'border-transparent bg-bed-occupied text-white' },
    limpieza: { etiqueta: 'En limpieza', estilo: 'border-warning-border bg-warning-soft text-warning-ink' },
    mantenimiento: { etiqueta: 'En mantenimiento', estilo: 'border-border bg-muted text-foreground' },
};

function CamaFicha({ cama, activa, bloqueada, onSelect }: {
    cama: Cama;
    activa: boolean;
    bloqueada: boolean;
    onSelect: (cama: Cama) => void;
}) {
    const estado = !activa && cama.estado === 'disponible' ? ESTADOS.mantenimiento : ESTADOS[cama.estado];
    const etiqueta = !activa && cama.estado === 'disponible' ? 'Fuera de servicio' : estado.etiqueta;
    const gestionable = cama.estado === 'limpieza' || (cama.estado === 'ocupada' && !!cama.ocupante) ||
        (cama.estado === 'disponible' && activa);
    const ocupante = cama.ocupante?.paciente;
    const contenido = (
        <>
            <BedSingle aria-hidden className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{cama.codigo}</span>
                <span className="block text-xs">{etiqueta}</span>
                {ocupante && <span className="mt-0.5 block break-words text-xs">{ocupante.nombres} {ocupante.apellidos}</span>}
            </span>
            {gestionable && <ChevronRight aria-hidden className="size-4 shrink-0" />}
        </>
    );
    const clase = cn('flex min-h-16 w-full items-center gap-2 rounded-md border p-2.5 text-left', estado.estilo);

    return gestionable ? (
        <button
            type="button"
            disabled={bloqueada}
            aria-haspopup="dialog"
            aria-label={`${cama.codigo} ${etiqueta}${ocupante ? ` ${ocupante.nombres} ${ocupante.apellidos}` : ''}`}
            className={cn(clase, 'cursor-pointer hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default')}
            onClick={() => onSelect(cama)}
        >
            {contenido}
        </button>
    ) : <div className={clase}>{contenido}</div>;
}

function PlantaCard({ planta, habitaciones, bloqueada, onSelect }: {
    planta: (typeof PLANTAS)[number];
    habitaciones: Habitacion[];
    bloqueada: boolean;
    onSelect: (cama: Cama) => void;
}) {
    const camas = habitaciones.flatMap((h) => h.camas);
    const ocupadas = camas.filter((c) => c.estado === 'ocupada').length;
    return (
        <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Planta {planta.numero} · {planta.nombre}</h2>
                <Badge>{ocupadas}/{camas.length} camas ocupadas</Badge>
            </div>
            <div className={cn('grid gap-3', planta.columnas)}>
                {habitaciones.map((h) => (
                    <div key={h.id} className="rounded-xl border border-border p-3">
                        <h3 className="mb-2 text-sm font-semibold">{h.codigo}</h3>
                        <div className={cn('grid gap-2', h.camas.length === 2 && 'min-[400px]:grid-cols-2')}>
                            {h.camas.map((cama) => (
                                <CamaFicha key={cama.id} cama={cama} activa={h.activa} bloqueada={bloqueada} onSelect={onSelect} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {habitaciones.length === 0 && <p className="text-sm text-muted-foreground">No hay habitaciones registradas en esta planta.</p>}
        </Card>
    );
}

export default function MapaPlantasPage() {
    const [filtro, setFiltro] = useState('ambas');
    const [seleccion, setSeleccion] = useState<Cama | null>(null);
    const [mensaje, setMensaje] = useState('');
    const mapa = useMapaPlantas();
    const habitaciones = mapa.data ?? [];
    const plantas = PLANTAS.filter((p) => filtro === 'ambas' || String(p.numero) === filtro);
    const camas = habitaciones.flatMap((h) => h.camas);
    const ocupadas = camas.filter((c) => c.estado === 'ocupada').length;
    const conexion = isDemoMode ? 'Demostración' : mapa.isError ? 'Ocupación desactualizada' :
        mapa.enVivo ? 'En vivo' : 'Actualización periódica';

    return (
        <>
            <PageHeader
                title="Mapa de plantas"
                subtitle={mapa.data && `${ocupadas} de ${camas.length} camas ocupadas en el hospital`}
                actions={(
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge role="status" tone={mapa.isError ? 'warning' : mapa.enVivo ? 'success' : 'neutral'}>{conexion}</Badge>
                        <Select aria-label="Planta" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                            <option value="ambas">Ambas plantas</option>
                            <option value="3">Planta 3 · VIP</option>
                            <option value="2">Planta 2 · Semiprivadas</option>
                        </Select>
                    </div>
                )}
            />

            {mapa.isPending && (
                <div className="space-y-4">
                    <span className="sr-only" role="status">Cargando mapa de plantas…</span>
                    {plantas.map((planta) => (
                        <Card key={planta.numero} className="p-4" aria-hidden>
                            <Skeleton className="mb-4 h-5 w-48" />
                            <div className={cn('grid gap-3', planta.columnas)}>
                                {Array.from({ length: planta.habitaciones }, (_, i) => <Skeleton key={i} className="h-24" />)}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {mapa.isError && (
                    <Card>
                        <ErrorState
                            title="No se pudo actualizar el mapa de plantas"
                            description="Reintenta para consultar la ocupación actual y gestionar las camas."
                            onRetry={() => void mapa.refetch()}
                        />
                    </Card>
                )}
                {mensaje && <Alert title={mensaje} />}
                {mapa.isSuccess && habitaciones.length === 0 && <Card><EmptyState title="No hay habitaciones registradas" /></Card>}
                {habitaciones.length > 0 && plantas.map((planta) => (
                    <PlantaCard
                        key={planta.numero}
                        planta={planta}
                        habitaciones={habitaciones.filter((h) => h.planta === planta.numero)}
                        bloqueada={mapa.isError}
                        onSelect={(cama) => { setMensaje(''); setSeleccion(cama); }}
                    />
                ))}
            </div>
            {seleccion && (
                <GestionCamaDialog
                    key={seleccion.id}
                    seleccion={seleccion}
                    habitaciones={habitaciones}
                    sinDatos={!mapa.isSuccess}
                    usuario={mapa.usuario}
                    vista={mapa.vista}
                    onClose={() => setSeleccion(null)}
                    onChange={mapa.refetch}
                    onSaved={(resultado) => { setSeleccion(null); setMensaje(resultado); }}
                />
            )}
        </>
    );
}
