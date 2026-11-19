import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { cambiarEstadoProveedor, listarProveedores } from '@/services/inventario.service';
import type { Proveedor } from '@/types/inventario.types';

import { OperacionDialog, ProveedorDialog } from './InventarioDialogs';
import { AccionesFila, FiltroEstado, TablaPaginada, type AlGuardar } from './InventarioUI';

export function ProveedoresInventario({ soloLectura, onSaved }: { soloLectura: boolean; onSaved: AlGuardar }) {
    const [buscar, setBuscar] = useState('');
    const [estado, setEstado] = useState<'' | 'true' | 'false'>('');
    const [pagina, setPagina] = useState(1);
    const [modal, setModal] = useState<{ tipo: 'formulario'; proveedor?: Proveedor } | { tipo: 'estado'; proveedor: Proveedor }>();
    const proveedores = useResource(
        () => listarProveedores({ buscar, activo: estado === '' ? undefined : estado === 'true' }, pagina),
        [buscar, estado, pagina],
    );
    const controles = {
        onClose: () => setModal(undefined),
        onSaved: (mensaje: string) => {
            setModal(undefined);
            setPagina(1);
            proveedores.refetch();
            onSaved(mensaje);
        },
    };

    const columnas: Column<Proveedor>[] = [
        { header: 'Proveedor', cell: (prov) => <span className="font-semibold">{prov.nombre}</span> },
        { header: 'NIT', cell: (prov) => <span className="whitespace-nowrap">{prov.nit ?? '—'}</span> },
        { header: 'NRC', cell: (prov) => prov.nrc ?? '—' },
        {
            header: 'Contacto',
            cell: (prov) => (
                <div className="grid gap-0.5">
                    {prov.contacto && <span>{prov.contacto}</span>}
                    {prov.telefono && <span className="text-xs text-muted-foreground">{prov.telefono}</span>}
                    {prov.email && <span className="break-all text-xs text-muted-foreground">{prov.email}</span>}
                    {!prov.contacto && !prov.telefono && !prov.email && '—'}
                </div>
            ),
        },
        { header: 'Dirección', cell: (prov) => prov.direccion ?? '—' },
        { header: 'Estado', cell: (prov) => <StatusBadge estado={prov.activo ? 'activo' : 'inactivo'} /> },
        {
            header: '',
            cell: (proveedor) => !soloLectura && (
                <AccionesFila>
                    <Button size="sm" variant="link" onClick={() => setModal({ tipo: 'formulario', proveedor })}
                        aria-label={`Editar ${proveedor.nombre}`}>Editar</Button>
                    <Button size="sm" variant={proveedor.activo ? 'link-danger' : 'link'}
                        onClick={() => setModal({ tipo: 'estado', proveedor })}
                        aria-label={`${proveedor.activo ? 'Desactivar' : 'Activar'} ${proveedor.nombre}`}>
                        {proveedor.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                </AccionesFila>
            ),
        },
    ];

    return (
        <>
            <Toolbar>
                <SearchInput className="w-64" aria-label="Buscar proveedores" placeholder="Buscar nombre, NIT o NRC" maxLength={100}
                    value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} />
                <FiltroEstado value={estado} onChange={(value) => { setEstado(value); setPagina(1); }} />
                {!soloLectura && (
                    <Button className="ml-auto" onClick={() => setModal({ tipo: 'formulario' })}><Plus /> Nuevo proveedor</Button>
                )}
            </Toolbar>
            <TablaPaginada label="Proveedores" columnas={columnas} recurso={proveedores} pagina={pagina}
                setPagina={setPagina} vacio="No hay proveedores que coincidan con los filtros" />
            {modal?.tipo === 'formulario' && <ProveedorDialog {...controles} proveedor={modal.proveedor} />}
            {modal?.tipo === 'estado' && (
                <OperacionDialog {...controles} titulo={modal.proveedor.activo ? 'Desactivar proveedor' : 'Activar proveedor'}
                    descripcion={modal.proveedor.nombre} boton={modal.proveedor.activo ? 'Desactivar' : 'Activar'}
                    peligro={modal.proveedor.activo} resultado={modal.proveedor.activo ? 'Proveedor desactivado.' : 'Proveedor activado.'}
                    ejecutar={() => cambiarEstadoProveedor(modal.proveedor.id, !modal.proveedor.activo)}>
                    {modal.proveedor.activo && <p className="text-sm">Se conservará su historial. El proveedor dejará de aparecer en las listas para nuevas entradas y activos.</p>}
                </OperacionDialog>
            )}
        </>
    );
}
