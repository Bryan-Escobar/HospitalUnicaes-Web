import { useState } from 'react';
import { CalendarClock, ClipboardList, Package, Truck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { KpiCard } from '@/components/KpiCard';
import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useResource, type Resource } from '@/hooks/useResource';
import { isDemoMode } from '@/lib/client';
import { cn } from '@/lib/utils';
import { listarAlertas } from '@/services/inventario.service';
import {
    ALERTAS_CADUCIDAD,
    type AlertaCaducidad,
    type AlertasInventario,
    type CategoriaInventario,
    type LoteConAlerta,
} from '@/types/inventario.types';

import { ActivosInventario } from './ActivosInventario';
import { CatalogoInventario } from './CatalogoInventario';
import { DetalleInventario } from './DetalleInventario';
import { CaducidadBadge, FechaInventario, FiltroCategoria } from './InventarioUI';
import { ProveedoresInventario } from './ProveedoresInventario';

const VISTAS = [
    { id: '', texto: 'Catálogo', icono: ClipboardList },
    { id: 'activos', texto: 'Activos', icono: Package },
    { id: 'proveedores', texto: 'Proveedores', icono: Truck },
    { id: 'caducidad', texto: 'Caducidad', icono: CalendarClock },
] as const;

const INDICADORES = [
    { alerta: 'vencido', label: 'Lotes vencidos', campo: 'vencidos' },
    { alerta: '15_dias', label: 'Vencen en 0 a 15 días', campo: 'en_15_dias' },
    { alerta: '30_dias', label: 'Vencen en 16 a 30 días', campo: 'en_30_dias' },
] as const;

const columnasAlertas: Column<LoteConAlerta>[] = [
    {
        header: 'Ítem',
        cell: (lote) => (
            <>
                <span className="block font-semibold">{lote.item.nombre}</span>
                <span className="text-xs text-muted-foreground">{lote.item.codigo}</span>
            </>
        ),
    },
    { header: 'Lote', cell: (lote) => lote.numero_lote },
    { header: 'Caducidad', cell: (lote) => <FechaInventario value={lote.fecha_caducidad} /> },
    { header: 'Cantidad', cell: (lote) => lote.cantidad_actual },
    { header: 'Estado', cell: (lote) => <CaducidadBadge alerta={lote.alerta} /> },
    {
        header: '',
        className: 'text-right',
        cell: (lote) => <Button asChild size="sm" variant="link">
            <Link to={`?item=${lote.item.id}`} aria-label={`Ver lotes de ${lote.item.nombre}`}>Ver lotes</Link>
        </Button>,
    },
];

function Caducidad({ recurso, alerta, cambiarAlerta }: {
    recurso: Resource<AlertasInventario>;
    alerta: AlertaCaducidad | '';
    cambiarAlerta: (value: AlertaCaducidad | '') => void;
}) {
    const [categoria, setCategoria] = useState<CategoriaInventario | ''>('');
    const [buscar, setBuscar] = useState('');
    const consulta = buscar.trim().toLowerCase();
    const filas = recurso.data?.items.filter((lote) =>
        (!alerta || lote.alerta === alerta) &&
        (!categoria || lote.item.categoria === categoria) &&
        [lote.numero_lote, lote.item.nombre, lote.item.codigo].some((valor) => valor.toLowerCase().includes(consulta)),
    );

    return (
        <>
            <Toolbar>
                <SearchInput className="w-64" aria-label="Buscar alertas de caducidad" placeholder="Buscar ítem o lote"
                    value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                <FiltroCategoria value={categoria} onChange={setCategoria} />
                <Select aria-label="Estado de caducidad" value={alerta} onChange={(e) => cambiarAlerta(e.target.value as AlertaCaducidad | '')}>
                    <option value="">Todas las alertas</option>
                    {Object.entries(ALERTAS_CADUCIDAD).map(([id, texto]) => <option key={id} value={id}>{texto}</option>)}
                </Select>
            </Toolbar>
            <DataTable label="Alertas de caducidad" columns={columnasAlertas} rows={filas}
                status={recurso.status === 'success' && !filas?.length ? 'empty' : recurso.status}
                rowKey={(lote) => lote.lote_id} onRetry={recurso.refetch}
                empty={{ title: 'No hay lotes con alertas que coincidan con los filtros' }} />
        </>
    );
}

export default function InventarioPage() {
    const [params, setParams] = useSearchParams();
    const vista = VISTAS.find(({ id }) => id === params.get('vista'))?.id ?? '';
    const itemId = params.get('item') || undefined;
    const bajoMinimo = params.get('stock') === 'bajo';
    const alerta = INDICADORES.find((indicador) => indicador.alerta === params.get('alerta'))?.alerta ?? '';
    const [mensaje, setMensaje] = useState('');
    const [version, setVersion] = useState(0);
    const alertas = useResource(() => listarAlertas(), [version], () => false);

    function onSaved(texto: string) {
        setMensaje(texto);
        setVersion((valor) => valor + 1);
    }

    return (
        <>
            {isDemoMode && <Alert className="mb-4">Modo demostración. Conecta el panel a la API para registrar operaciones.</Alert>}
            {mensaje && (
                <Alert className="mb-4" action={<Button size="sm" variant="ghost" onClick={() => setMensaje('')}>Cerrar</Button>}>
                    {mensaje}
                </Alert>
            )}
            {itemId && vista === '' ? (
                <DetalleInventario key={itemId} id={itemId} version={version} soloLectura={isDemoMode} onSaved={onSaved}
                    volver={bajoMinimo ? '/inventario?stock=bajo' : '/inventario'} />
            ) : (
                <>
                    <PageHeader title="Inventario y recursos" />
                    <section aria-label="Resumen de caducidad" className="mb-5 grid gap-4 sm:grid-cols-3">
                        {INDICADORES.map(({ alerta: codigo, label, campo }) => (
                            <Link key={codigo} to={`?vista=caducidad&alerta=${codigo}`} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
                                <KpiCard label={label} status={alertas.status === 'empty' ? 'success' : alertas.status}
                                    value={alertas.data?.resumen[campo]} highlight={!!alertas.data?.resumen[campo]} />
                            </Link>
                        ))}
                    </section>
                    <nav aria-label="Secciones de inventario" className="mb-5 flex flex-wrap gap-1 border-b border-border">
                        {VISTAS.map(({ id, texto, icono: Icon }) => (
                            <Link key={id} to={id ? `?vista=${id}` : '/inventario'} aria-current={vista === id ? 'page' : undefined}
                                className={cn(
                                    'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium',
                                    vista === id ? 'border-primary text-primary-ink' : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}>
                                <Icon className="size-4" aria-hidden /> {texto}
                            </Link>
                        ))}
                    </nav>
                    {vista === '' && <CatalogoInventario bajoMinimo={bajoMinimo} soloLectura={isDemoMode} onSaved={onSaved} />}
                    {vista === 'activos' && <ActivosInventario key={itemId ?? 'todos'} itemId={itemId} soloLectura={isDemoMode} onSaved={onSaved} />}
                    {vista === 'proveedores' && <ProveedoresInventario soloLectura={isDemoMode} onSaved={onSaved} />}
                    {vista === 'caducidad' && <Caducidad recurso={alertas} alerta={alerta}
                        cambiarAlerta={(value) => setParams(value ? { vista, alerta: value } : { vista })} />}
                </>
            )}
        </>
    );
}
