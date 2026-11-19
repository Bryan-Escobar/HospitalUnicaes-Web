import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { Resource } from '@/hooks/useResource';
import { POR_PAGINA } from '@/services/inventario.service';
import type { Paginado } from '@/types/admin.types';
import { ALERTAS_CADUCIDAD, CATEGORIAS, type AlertaCaducidad, type CategoriaInventario } from '@/types/inventario.types';

export type AlGuardar = (mensaje: string) => void;

export function FiltroCategoria({ value, onChange }: {
    value: CategoriaInventario | '';
    onChange: (categoria: CategoriaInventario | '') => void;
}) {
    return (
        <Select aria-label="Categoría" value={value} onChange={(e) => onChange(e.target.value as CategoriaInventario | '')}>
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </Select>
    );
}

export function FiltroEstado({ value, onChange, todos = true }: {
    todos?: boolean;
    value: '' | 'true' | 'false';
    onChange: (estado: '' | 'true' | 'false') => void;
}) {
    return (
        <Select aria-label="Estado" value={value} onChange={(e) => onChange(e.target.value as '' | 'true' | 'false')}>
            {todos && <option value="">Todos los estados</option>}
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
        </Select>
    );
}

export function CaducidadBadge({ alerta }: { alerta: AlertaCaducidad | null }) {
    if (!alerta) return <span className="text-muted-foreground">Vigente</span>;
    return <Badge tone={alerta === 'vencido' ? 'danger' : alerta === '15_dias' ? 'warning' : 'info'}>{ALERTAS_CADUCIDAD[alerta]}</Badge>;
}

const formatoFecha = new Intl.DateTimeFormat('es-SV', { timeZone: 'UTC', dateStyle: 'medium' });

export function FechaInventario({ value }: { value: string }) {
    return <time dateTime={value} className="whitespace-nowrap">{formatoFecha.format(new Date(`${value}T00:00:00Z`))}</time>;
}

export function AccionesFila({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 whitespace-nowrap">{children}</div>;
}

export function TablaPaginada<T extends { id: string }>({
    label, columnas, recurso, pagina, setPagina, vacio,
}: {
    label: string;
    columnas: Column<T>[];
    recurso: Resource<Paginado<T>>;
    pagina: number;
    setPagina: (pagina: number) => void;
    vacio: string;
}) {
    const ultimaPagina = Math.max(1, Math.ceil((recurso.data?.total ?? 0) / POR_PAGINA));
    return (
        <DataTable label={label} columns={columnas} rows={recurso.data?.items} status={recurso.status}
            rowKey={(row) => row.id} onRetry={recurso.refetch}
            empty={{
                title: vacio,
                action: pagina > ultimaPagina && (
                    <Button variant="outline" onClick={() => setPagina(ultimaPagina)}>Volver a la última página</Button>
                ),
            }}
            footer={recurso.data && recurso.data.total > POR_PAGINA && (
                <Pagination page={pagina} pageSize={POR_PAGINA} total={recurso.data.total} onPageChange={setPagina} />
            )}
        />
    );
}
