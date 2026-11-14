import { CalendarClock, Globe, Lock, Megaphone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { fechaHoraLegible } from '@/lib/fechas-hospital';
import type { CrearAvisoBody } from '@/types/avisos.types';

// Cómo se verá el aviso: la tarjeta que reciben las apps en /api/publico/estado (públicos) o el
// personal en la app (internos). Solo muestra título, contenido y fechas, igual que el endpoint público.
export function AvisoPreview({ aviso }: { aviso: CrearAvisoBody }) {
    const programado = new Date(aviso.fecha_publicacion).getTime() > Date.now();
    return (
        <section aria-label="Vista previa del aviso" className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {aviso.es_publico ? (
                    <Badge tone="primary">
                        <Globe className="size-3" aria-hidden /> Público
                    </Badge>
                ) : (
                    <Badge>
                        <Lock className="size-3" aria-hidden /> Interno
                    </Badge>
                )}
                <span>
                    {aviso.es_publico
                        ? 'Lo verá cualquiera, incluso sin iniciar sesión.'
                        : 'Solo lo verá el personal con sesión iniciada.'}
                </span>
            </div>

            <article className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary">
                        <Megaphone className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <h3 className="font-semibold break-words">{aviso.titulo}</h3>
                        <p className="mt-1 text-sm whitespace-pre-line break-words">{aviso.contenido}</p>
                        <p className="mt-3 text-xs text-muted-foreground">Publicado: {fechaHoraLegible(aviso.fecha_publicacion)}</p>
                    </div>
                </div>
            </article>

            <p className="flex items-start gap-2 text-sm">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                    {programado
                        ? `Se mostrará a partir del ${fechaHoraLegible(aviso.fecha_publicacion)}`
                        : 'Se mostrará en cuanto lo publiques'}
                    {aviso.fecha_expiracion
                        ? ` y dejará de mostrarse el ${fechaHoraLegible(aviso.fecha_expiracion)}.`
                        : ' y no tiene fecha de expiración.'}
                </span>
            </p>
        </section>
    );
}
