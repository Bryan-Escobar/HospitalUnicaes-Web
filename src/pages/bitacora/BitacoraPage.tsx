import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, ClipboardList } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { ESTADO_LABELS } from '@/lib/estados';
import { fechaHoraCorta, fechaHoraLegible } from '@/lib/fechas-hospital';
import { PAGE_SIZE } from '@/services/admin.service';
import { listarBitacora } from '@/services/ambulancia.service';
import {
    ESTADOS_SOLICITUD, PRIORIDADES_EMERGENCIA, TIPOS_EMERGENCIA,
    type EntradaBitacora, type FiltroBitacora,
} from '@/types/ambulancia.types';

const ESTADOS_AMBULANCIA = ['disponible', 'en_servicio', 'en_mantenimiento'] as const;
const FILTRO_INICIAL: FiltroBitacora = { desde: '', hasta: '', estado: '', tipo: '', page: 1 };

const nombreCompleto = (persona: EntradaBitacora['registrado_por']) =>
    persona ? `${persona.nombres} ${persona.apellidos}` : '—';

function DetalleBitacora({ entrada, onClose }: { entrada: EntradaBitacora; onClose: () => void }) {
    const solicitud = entrada.solicitud;
    const datos = [
        ['Estado anterior', entrada.estado_anterior && ESTADO_LABELS[entrada.estado_anterior]],
        ['Estado registrado', ESTADO_LABELS[entrada.estado_nuevo]],
        ['Registrado por', nombreCompleto(entrada.registrado_por)],
        ['Descripción del registro', entrada.descripcion],
    ];
    if (solicitud) {
        const coordenadas = solicitud.latitud !== null && solicitud.longitud !== null
            ? `${solicitud.latitud}, ${solicitud.longitud}`
            : null;
        datos.push(
            ['Paciente', nombreCompleto(solicitud.paciente)],
            ['Tipo de emergencia', solicitud.tipo_emergencia && TIPOS_EMERGENCIA[solicitud.tipo_emergencia]],
            ['Prioridad', PRIORIDADES_EMERGENCIA[solicitud.prioridad]],
            ['Estado de la solicitud', ESTADOS_SOLICITUD[solicitud.estado]],
            ['Canal', solicitud.canal === 'app' ? 'Aplicación' : 'Solicitud pública'],
            ['Origen', solicitud.direccion_origen ?? coordenadas],
            ['Destino', solicitud.destino],
            ['Solicitada', fechaHoraLegible(solicitud.fecha_solicitud)],
            ['Despachada', solicitud.fecha_despacho && fechaHoraLegible(solicitud.fecha_despacho)],
            ['Cierre', solicitud.fecha_cierre && fechaHoraLegible(solicitud.fecha_cierre)],
            ['Descripción de la emergencia', solicitud.descripcion_emergencia],
        );
    }

    return (
        <Dialog open onClose={onClose} title="Detalle del registro" description={fechaHoraLegible(entrada.created_at)}
            className="max-h-[90dvh] max-w-2xl overflow-y-auto">
            <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                {datos.map(([label, valor]) => (
                    <div key={label} className="min-w-0">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="whitespace-pre-wrap wrap-break-word font-medium">{valor || '—'}</dd>
                    </div>
                ))}
            </dl>
        </Dialog>
    );
}

export default function BitacoraPage() {
    const [filtro, setFiltro] = useState<FiltroBitacora>(FILTRO_INICIAL);
    const [detalle, setDetalle] = useState<EntradaBitacora | null>(null);
    const fechaInvalida = Boolean(filtro.desde && filtro.hasta && filtro.desde > filtro.hasta);
    const bitacora = useResource(
        () => fechaInvalida ? Promise.resolve({ items: [], total: 0 }) : listarBitacora(filtro),
        [filtro],
    );
    const cambiar = (parcial: Partial<FiltroBitacora>) => setFiltro((f) => ({ ...f, ...parcial, page: 1 }));
    const hayFiltros = Boolean(filtro.desde || filtro.hasta || filtro.estado || filtro.tipo);

    const columnas: Column<EntradaBitacora>[] = [
        { header: 'Fecha', cell: (e) => <span className="whitespace-nowrap font-semibold">{fechaHoraCorta(e.created_at)}</span> },
        { header: 'Estado', cell: (e) => <StatusBadge estado={e.estado_nuevo} /> },
        { header: 'Tipo de emergencia', cell: (e) => e.solicitud?.tipo_emergencia ? TIPOS_EMERGENCIA[e.solicitud.tipo_emergencia] : '—' },
        { header: 'Paciente', cell: (e) => nombreCompleto(e.solicitud?.paciente ?? null) },
        { header: 'Registrado por', cell: (e) => nombreCompleto(e.registrado_por) },
        {
            header: 'Detalle',
            cell: (e) => <Button variant="outline" size="sm" onClick={() => setDetalle(e)}>Ver detalle</Button>,
        },
    ];

    return (
        <>
            <PageHeader
                title="Bitácora de ambulancia"
                actions={<Button variant="outline" asChild><Link to="/ambulancia"><Ambulance /> Ver ambulancia</Link></Button>}
            />

            <Toolbar>
                <label className="flex items-center gap-2 text-sm">
                    Desde
                    <Input type="date" value={filtro.desde} max={filtro.hasta || undefined} aria-invalid={fechaInvalida}
                        onChange={(e) => cambiar({ desde: e.target.value })} />
                </label>
                <label className="flex items-center gap-2 text-sm">
                    Hasta
                    <Input type="date" value={filtro.hasta} min={filtro.desde || undefined} aria-invalid={fechaInvalida}
                        onChange={(e) => cambiar({ hasta: e.target.value })} />
                </label>
                <Select aria-label="Estado" value={filtro.estado}
                    onChange={(e) => cambiar({ estado: e.target.value as FiltroBitacora['estado'] })}>
                    <option value="">Todos los estados</option>
                    {ESTADOS_AMBULANCIA.map((estado) => <option key={estado} value={estado}>{ESTADO_LABELS[estado]}</option>)}
                </Select>
                <Select aria-label="Tipo de emergencia" value={filtro.tipo}
                    onChange={(e) => cambiar({ tipo: e.target.value as FiltroBitacora['tipo'] })}>
                    <option value="">Todos los tipos</option>
                    {Object.entries(TIPOS_EMERGENCIA).map(([tipo, label]) => <option key={tipo} value={tipo}>{label}</option>)}
                </Select>
                {hayFiltros && <Button variant="ghost" onClick={() => setFiltro(FILTRO_INICIAL)}>Limpiar filtros</Button>}
            </Toolbar>

            {fechaInvalida ? (
                <Alert tone="warning">La fecha inicial debe ser anterior o igual a la fecha final.</Alert>
            ) : (
                <DataTable
                    label="Bitácora de ambulancia"
                    columns={columnas}
                    rows={bitacora.data?.items}
                    status={bitacora.status}
                    rowKey={(e) => e.id}
                    onRetry={bitacora.refetch}
                    empty={{
                        icon: ClipboardList,
                        title: hayFiltros ? 'Sin registros con esos filtros' : 'Sin registros en la bitácora',
                        description: hayFiltros ? 'Quita algún filtro o amplía el rango de fechas.' : undefined,
                    }}
                    footer={bitacora.data && (
                        <Pagination
                            page={filtro.page}
                            pageSize={PAGE_SIZE}
                            total={bitacora.data.total}
                            onPageChange={(page) => setFiltro((f) => ({ ...f, page }))}
                        />
                    )}
                />
            )}

            {detalle && <DetalleBitacora entrada={detalle} onClose={() => setDetalle(null)} />}
        </>
    );
}
