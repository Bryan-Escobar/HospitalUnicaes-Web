import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Toolbar } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input, SearchInput } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { cambiarEstadoItem, listarItems } from '@/services/inventario.service';
import { CATEGORIAS, type CategoriaInventario, type ItemInventario } from '@/types/inventario.types';

import { ItemDialog, OperacionDialog } from './InventarioDialogs';
import { AccionesFila, FiltroCategoria, FiltroEstado, TablaPaginada, type AlGuardar } from './InventarioUI';

export function CatalogoInventario({ bajoMinimo, soloLectura, onSaved }: {
    bajoMinimo: boolean;
    soloLectura: boolean;
    onSaved: AlGuardar;
}) {
    const navegar = useNavigate();
    const [buscar, setBuscar] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [categoria, setCategoria] = useState<CategoriaInventario | ''>('');
    const [estado, setEstado] = useState<'' | 'true' | 'false'>('true');
    const [pagina, setPagina] = useState(1);
    const [modal, setModal] = useState<{ tipo: 'formulario'; item?: ItemInventario } | { tipo: 'estado'; item: ItemInventario }>();
    const items = useResource(() => listarItems({
        buscar, ubicacion, categoria: categoria || undefined, bajo_minimo: bajoMinimo || undefined,
        activo: estado !== 'false',
    }, pagina), [buscar, ubicacion, categoria, bajoMinimo, estado, pagina]);

    const controles = {
        onClose: () => setModal(undefined),
        onSaved: (mensaje: string) => {
            setModal(undefined);
            setPagina(1);
            items.refetch();
            onSaved(mensaje);
        },
    };

    const columnas: Column<ItemInventario>[] = [
        {
            header: 'Ítem',
            cell: (item) => (
                <>
                    <span className="block font-semibold">{item.nombre}</span>
                    <span className="text-xs text-muted-foreground">{item.codigo}</span>
                </>
            ),
        },
        { header: 'Categoría', cell: (item) => CATEGORIAS[item.categoria] },
        {
            header: 'Stock total',
            cell: (item) => (
                <div className="grid justify-items-start gap-1 tabular">
                    <span>{item.stock_actual} {item.unidad_medida}</span>
                    {item.bajo_minimo && <StatusBadge estado="stock_bajo" />}
                </div>
            ),
        },
        { header: 'Mínimo', cell: (item) => item.stock_minimo },
        { header: 'Ubicación', cell: (item) => item.ubicacion ?? '—' },
        { header: 'Estado', cell: (item) => <StatusBadge estado={item.activo ? 'activo' : 'inactivo'} /> },
        {
            header: '',
            cell: (item) => (
                <AccionesFila>
                    {item.tipo_control === 'lote' ? (
                        <Button asChild size="sm" variant="link">
                            <Link to={`?item=${item.id}${bajoMinimo ? '&stock=bajo' : ''}`} aria-label={`Ver lotes de ${item.nombre}`}>Ver lotes</Link>
                        </Button>
                    ) : (
                        <Button asChild size="sm" variant="link">
                            <Link to={`?vista=activos&item=${item.id}`} aria-label={`Ver activos de ${item.nombre}`}>Ver activos</Link>
                        </Button>
                    )}
                    {!soloLectura && (
                        <>
                            <Button size="sm" variant="link" onClick={() => setModal({ tipo: 'formulario', item })}
                                aria-label={`Editar ${item.nombre}`}>Editar</Button>
                            <Button size="sm" variant={item.activo ? 'link-danger' : 'link'}
                                onClick={() => setModal({ tipo: 'estado', item })}
                                aria-label={`${item.activo ? 'Desactivar' : 'Activar'} ${item.nombre}`}>
                                {item.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                        </>
                    )}
                </AccionesFila>
            ),
        },
    ];

    return (
        <>
            <Toolbar>
                <SearchInput className="w-60" aria-label="Buscar ítems" placeholder="Buscar código o nombre" maxLength={100}
                    value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} />
                <FiltroCategoria value={categoria} onChange={(value) => { setCategoria(value); setPagina(1); }} />
                <Input className="w-40" aria-label="Ubicación" placeholder="Ubicación" maxLength={100}
                    value={ubicacion} onChange={(e) => { setUbicacion(e.target.value); setPagina(1); }} />
                <FiltroEstado todos={false} value={estado} onChange={(value) => { setEstado(value); setPagina(1); }} />
                <FilterChip className="h-10 rounded-md" selected={bajoMinimo}
                    onClick={() => { setPagina(1); void navegar(bajoMinimo ? '/inventario' : '?stock=bajo'); }}>
                    Solo stock bajo
                </FilterChip>
                {!soloLectura && (
                    <Button className="ml-auto" onClick={() => setModal({ tipo: 'formulario' })}><Plus /> Nuevo ítem</Button>
                )}
            </Toolbar>
            <TablaPaginada label="Catálogo de inventario" columnas={columnas} recurso={items} pagina={pagina}
                setPagina={setPagina} vacio="No hay ítems que coincidan con los filtros" />
            {modal?.tipo === 'formulario' && <ItemDialog {...controles} item={modal.item} />}
            {modal?.tipo === 'estado' && (
                <OperacionDialog {...controles} titulo={modal.item.activo ? 'Desactivar ítem' : 'Activar ítem'}
                    descripcion={modal.item.nombre} boton={modal.item.activo ? 'Desactivar' : 'Activar'} peligro={modal.item.activo}
                    resultado={modal.item.activo ? 'Ítem desactivado.' : 'Ítem activado.'}
                    ejecutar={() => cambiarEstadoItem(modal.item.id, !modal.item.activo)}>
                    {modal.item.activo && <p className="text-sm">Puedes desactivar el ítem cuando su stock total sea cero.</p>}
                </OperacionDialog>
            )}
        </>
    );
}
