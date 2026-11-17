import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface OpcionPersonal {
    id: string;
    nombre: string;
    detalle: string;
}

function normalizar(texto: string) {
    return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export function SelectorPersonal({
    id,
    etiqueta,
    texto,
    opciones,
    seleccion,
    onSelect,
    onClear,
}: {
    id?: string;
    etiqueta: string;
    texto: string;
    opciones: OpcionPersonal[];
    seleccion: readonly string[];
    onSelect: (opcion: OpcionPersonal) => void;
    onClear?: () => void;
}) {
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const boton = useRef<HTMLButtonElement>(null);
    const terminos = normalizar(busqueda.trim()).split(/\s+/);
    const visibles = opciones.filter(({ nombre, detalle }) => {
        const contenido = normalizar(`${nombre} ${detalle}`);
        return terminos.every((termino) => contenido.includes(termino));
    });

    function cambiarApertura(siguiente: boolean) {
        setAbierto(siguiente);
        if (!siguiente) setBusqueda('');
    }

    return (
        <Popover open={abierto} onOpenChange={cambiarApertura}>
            <PopoverTrigger asChild>
                <Button
                    ref={boton}
                    id={id}
                    type="button"
                    variant="outline"
                    aria-label={`${etiqueta}: ${texto}`}
                    className={id ? 'w-full justify-between' : 'max-w-full justify-between'}
                >
                    <span className="truncate">{texto}</span>
                    <ChevronDown aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                container={boton.current?.closest<HTMLElement>('[data-slot="dialog-content"]')}
                align="start"
                aria-label={etiqueta}
                className="flex max-h-(--radix-popover-content-available-height) w-[min(24rem,calc(100vw-2rem))] max-w-(--radix-popover-content-available-width) flex-col gap-2 p-2"
            >
                <SearchInput
                    aria-label="Buscar personal"
                    placeholder="Buscar por nombre o apellido"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.preventDefault(); }}
                />
                {visibles.length === 0 && (
                    <p role="status" className="p-2 text-sm text-muted-foreground">
                        No se encontró personal.
                    </p>
                )}
                <ul className="max-h-56 min-h-0 space-y-1 overflow-y-auto p-1">
                    {visibles.map((opcion) => {
                        const contenido = (
                            <span className="min-w-0 break-words">
                                <span className="block font-medium">{opcion.nombre}</span>
                                <span className="block text-xs text-muted-foreground">{opcion.detalle}</span>
                            </span>
                        );
                        return (
                            <li key={opcion.id}>
                                {onClear ? (
                                    <label className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-muted">
                                        <input
                                            type="checkbox"
                                            className="size-4 shrink-0 accent-primary"
                                            checked={seleccion.includes(opcion.id)}
                                            onChange={() => onSelect(opcion)}
                                        />
                                        {contenido}
                                    </label>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        aria-pressed={seleccion.includes(opcion.id)}
                                        className="h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left"
                                        onClick={() => { onSelect(opcion); cambiarApertura(false); }}
                                    >
                                        {contenido}
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
                {onClear && seleccion.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="self-start" onClick={onClear}>
                        Quitar filtro de personas
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
}
