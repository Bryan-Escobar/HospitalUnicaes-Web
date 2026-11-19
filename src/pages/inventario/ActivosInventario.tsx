import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Toolbar } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useResource } from '@/hooks/useResource';
import { actualizarActivo, listarActivos, obtenerItem } from '@/services/inventario.service';
import { ESTADOS_ACTIVO, type Activo, type EstadoActivo } from '@/types/inventario.types';

import { EditarActivoDialog, NuevoActivoDialog, OperacionDialog } from './InventarioDialogs';
import { AccionesFila, TablaPaginada, type AlGuardar } from './InventarioUI';

export function ActivosInventario({ itemId, soloLectura, onSaved }: { itemId?: string; soloLectura: boolean; onSaved: AlGuardar }) {
    const [buscar, setBuscar] = useState('');
    const [estado, setEstado] = useState<EstadoActivo | ''>('');
    const [pagina, setPagina] = useState(1);
    const [modal, setModal] = useState<{ tipo: 'alta' } | { tipo: 'editar' | 'baja'; activo: Activo }>();
    const equipo = useResource(() => itemId ? obtenerItem(itemId) : Promise.resolve(null), [itemId]);
    const activos = useResource(
        () => listarActivos({ buscar, item_id: itemId, estado: estado || undefined }, pagina),
        [buscar, estado, itemId, pagina],
    );
    const controles = {
        onClose: () => setModal(undefined),
        onSaved: (mensaje: string) => {
            setModal(undefined);
            setPagina(1);
            activos.refetch();
            onSaved(mensaje);
        },
    };

    const columnas: Column<Activo>[] = [
        { header: 'Número de serie', cell: (activo) => <span className="font-semibold">{activo.numero_serie}</span> },
        {
            header: 'Equipo',
            cell: (activo) => (
                <>
                    <span className="block">{activo.item.nombre}</span>
                    <span className="text-xs text-muted-foreground">{activo.item.codigo}</span>
                </>
            ),
        },
        { header: 'Proveedor', cell: (activo) => activo.proveedor.nombre },
        { header: 'Ubicación', cell: (activo) => activo.ubicacion ?? '—' },
        {
            header: 'Estado',
            cell: (activo) => (
                <Badge tone={activo.estado === 'disponible' ? 'success' : activo.estado === 'en_uso' ? 'info' : 'neutral'}>
                    {ESTADOS_ACTIVO[activo.estado]}
                </Badge>
            ),
        },
        {
            header: '',
            cell: (activo) => !soloLectura && activo.estado !== 'dado_de_baja' && (
                <AccionesFila>
                    <Button size="sm" variant="link" onClick={() => setModal({ tipo: 'editar', activo })}
                        aria-label={`Editar activo ${activo.numero_serie}`}>Editar</Button>
                    <Button size="sm" variant="link-danger" onClick={() => setModal({ tipo: 'baja', activo })}
                        aria-label={`Dar de baja el activo ${activo.numero_serie}`}>Dar de baja</Button>
                </AccionesFila>
            ),
        },
    ];

    return (
        <>
            {itemId && (
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                    {equipo.data && <span className="font-semibold">{equipo.data.nombre}</span>}
                    <Button asChild size="sm" variant="outline"><Link to="?vista=activos">Ver todos los equipos</Link></Button>
                </div>
            )}
            <Toolbar>
                <SearchInput className="w-72" aria-label="Buscar activos" placeholder="Buscar número de serie o ubicación" maxLength={100}
                    value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} />
                <Select aria-label="Estado del activo" value={estado} onChange={(e) => { setEstado(e.target.value as EstadoActivo | ''); setPagina(1); }}>
                    <option value="">Todos los estados</option>
                    {Object.entries(ESTADOS_ACTIVO).map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
                </Select>
                {!soloLectura && (
                    <Button className="ml-auto" onClick={() => setModal({ tipo: 'alta' })}
                        disabled={!!itemId && (!equipo.data?.activo || equipo.data.tipo_control !== 'numero_serie')}>
                        <Plus /> Registrar activo
                    </Button>
                )}
            </Toolbar>
            <TablaPaginada label="Activos" columnas={columnas} recurso={activos} pagina={pagina}
                setPagina={setPagina} vacio="No hay activos que coincidan con los filtros" />
            {modal?.tipo === 'alta' && <NuevoActivoDialog {...controles} item={equipo.data ?? undefined} />}
            {modal?.tipo === 'editar' && <EditarActivoDialog {...controles} activo={modal.activo} />}
            {modal?.tipo === 'baja' && (
                <OperacionDialog {...controles} titulo="Dar de baja activo" boton="Dar de baja" peligro
                    descripcion={`${modal.activo.item.nombre} · Serie ${modal.activo.numero_serie}`}
                    resultado="Activo dado de baja."
                    ejecutar={() => actualizarActivo(modal.activo.id, { estado: 'dado_de_baja' })}>
                    <p className="text-sm">La baja es definitiva. El equipo se descontará del stock y conservará su registro.</p>
                </OperacionDialog>
            )}
        </>
    );
}
