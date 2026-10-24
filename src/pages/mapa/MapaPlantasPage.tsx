import { useState } from 'react';
import { Circle } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/feedback-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useResource } from '@/hooks/useResource';
import { cn } from '@/lib/utils';
import { obtenerMapa } from '@/services/admin.service';
import type { Cama, Habitacion, Planta } from '@/types/admin.types';

function CamaChip({ cama }: { cama: Cama }) {
    const ocupada = cama.paciente !== null;
    const prefijo = cama.cama ? `${cama.cama} · ` : '';
    return (
        <div
            className={cn(
                'flex h-10 flex-1 items-center justify-center gap-1.5 truncate rounded-md border px-2 text-[13px] font-medium',
                ocupada ? 'border-transparent bg-bed-occupied text-white' : 'border-success-ink/30 bg-success-soft text-success-ink',
            )}
        >
            {ocupada ? (
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-current" />
            ) : (
                <Circle aria-hidden className="size-3 shrink-0" strokeWidth={2.5} />
            )}
            <span className="truncate">
                {prefijo}
                {ocupada ? (
                    <>
                        {/* En VIP a 1280 px solo cabe el nombre; «Ocupada» se mantiene para lectores de pantalla */}
                        <span className={cama.cama ? 'sr-only' : 'sr-only 2xl:not-sr-only'}>Ocupada · </span>
                        {cama.paciente}
                    </>
                ) : (
                    'Libre'
                )}
            </span>
        </div>
    );
}

function HabitacionCard({ habitacion }: { habitacion: Habitacion }) {
    return (
        <div className="rounded-xl border border-border p-3">
            <h3 className="mb-3 text-sm font-semibold">{habitacion.codigo}</h3>
            <div className="flex gap-2">
                {habitacion.camas.map((c, i) => (
                    <CamaChip key={i} cama={c} />
                ))}
            </div>
        </div>
    );
}

function PlantaCard({ planta }: { planta: Planta }) {
    const camas = planta.habitaciones.flatMap((h) => h.camas);
    const ocupadas = camas.filter((c) => c.paciente).length;
    const esVip = planta.numero === 3;
    return (
        <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
                <h2 className="font-semibold">
                    Planta {planta.numero} · {planta.nombre}
                </h2>
                <Badge>
                    {ocupadas}/{camas.length} {esVip ? 'ocupadas' : 'camas ocupadas'}
                </Badge>
            </div>
            <div className={cn('grid gap-3', esVip ? 'grid-cols-5' : 'grid-cols-3')}>
                {planta.habitaciones.map((h) => (
                    <HabitacionCard key={h.codigo} habitacion={h} />
                ))}
            </div>
        </Card>
    );
}

function PlantaSkeleton({ columnas, habitaciones }: { columnas: string; habitaciones: number }) {
    return (
        <Card className="p-4" aria-hidden>
            <Skeleton className="mb-4 h-5 w-48" />
            <div className={cn('grid gap-3', columnas)}>
                {Array.from({ length: habitaciones }, (_, i) => (
                    <div key={i} className="space-y-3 rounded-xl border border-border p-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

// WEB-6 Mapa de plantas: 5 VIP (planta 3) y 6 semiprivadas de 2 camas (planta 2) = 17 camas.
export default function MapaPlantasPage() {
    const [filtro, setFiltro] = useState<'ambas' | '3' | '2'>('ambas');
    const mapa = useResource(obtenerMapa);
    const plantas = (mapa.data?.plantas ?? []).filter((p) => filtro === 'ambas' || String(p.numero) === filtro);
    const camas = (mapa.data?.plantas ?? []).flatMap((p) => p.habitaciones.flatMap((h) => h.camas));
    const ocupadas = camas.filter((c) => c.paciente).length;

    return (
        <>
            <PageHeader
                title="Mapa de plantas"
                subtitle={
                    <>
                        {mapa.status === 'success' ? `${ocupadas} de ${camas.length} camas ocupadas` : '17 camas en 11 habitaciones'} · leyenda:{' '}
                        <Circle aria-hidden className="inline size-3 align-[-1px]" strokeWidth={2.5} /> Libre ·{' '}
                        <span aria-hidden className="inline-block size-2 rounded-full bg-bed-occupied align-[1px]" /> Ocupada
                    </>
                }
                actions={
                    <Select aria-label="Planta" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
                        <option value="ambas">Planta: Ambas</option>
                        <option value="3">Planta 3 · VIP</option>
                        <option value="2">Planta 2 · semiprivadas</option>
                    </Select>
                }
            />

            {mapa.status === 'loading' && (
                <div className="space-y-4">
                    <span className="sr-only" role="status">
                        Cargando mapa de plantas…
                    </span>
                    {filtro !== '2' && <PlantaSkeleton columnas="grid-cols-5" habitaciones={5} />}
                    {filtro !== '3' && <PlantaSkeleton columnas="grid-cols-3" habitaciones={6} />}
                </div>
            )}

            {mapa.status === 'error' && (
                <Card>
                    <ErrorState
                        title="No se pudo cargar el mapa de plantas"
                        description="La ocupación se mostrará cuando se recupere la conexión. No asignes camas mientras tanto."
                        onRetry={mapa.refetch}
                    />
                </Card>
            )}

            {mapa.status === 'success' && (
                <div className="space-y-4">
                    {mapa.data?.ultimoCambio ? (
                        <Alert title="Actualizado ahora:">{mapa.data.ultimoCambio}</Alert>
                    ) : (
                        ocupadas === 0 && (
                            <Alert title="Sin pacientes hospitalizados">
                                Las 17 camas están libres. Las asignaciones se hacen desde recepción (Android).
                            </Alert>
                        )
                    )}
                    {plantas.map((p) => (
                        <PlantaCard key={p.numero} planta={p} />
                    ))}
                </div>
            )}
        </>
    );
}
