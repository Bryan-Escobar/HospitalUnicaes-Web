import { useState } from 'react';
import { CalendarX2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import { PageHeader, Toolbar } from '@/components/layout/AdminLayout';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { useResource } from '@/hooks/useResource';
import { fechaHospital, horaLegible, instanteHospital, lunesDe, sumarDias } from '@/lib/fechas-hospital';
import { cn } from '@/lib/utils';
import { listarTurnos } from '@/services/turnos.service';
import { TIPOS_TURNO, type Turno } from '@/types/turnos.types';
import { SelectorPersonal, type OpcionPersonal } from './SelectorPersonal';
import { TurnoFormDialog } from './TurnoFormDialog';

const formatoDia = new Intl.DateTimeFormat('es-SV', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
const formatoSemana = new Intl.DateTimeFormat('es-SV', { dateStyle: 'long', timeZone: 'UTC' });
const fechaUTC = (fecha: string) => new Date(`${fecha}T00:00:00Z`);

interface FilaTurnos {
    id: string;
    nombre: string;
    tipo: string;
    area?: string;
    turnos: Turno[];
}

function agruparTurnos(turnos: Turno[], porArea: boolean): FilaTurnos[] {
    const filas = new Map<string, FilaTurnos>();
    for (const turno of turnos) {
        const id = porArea ? `${turno.personal_id}:${turno.area}` : turno.personal_id;
        const fila = filas.get(id) ?? {
            id,
            nombre: `${turno.nombres} ${turno.apellidos}`,
            tipo: turno.tipo_personal,
            area: porArea ? turno.area : undefined,
            turnos: [],
        };
        fila.turnos.push(turno);
        filas.set(id, fila);
    }

    return [...filas.values()].sort((a, b) =>
        (a.area ?? '').localeCompare(b.area ?? '', 'es') || a.nombre.localeCompare(b.nombre, 'es'),
    );
}

function CeldaTurnos({ turnos, fecha }: { turnos: Turno[]; fecha: string }) {
    const inicioDia = Date.parse(instanteHospital(fecha));
    const finDia = Date.parse(instanteHospital(sumarDias(fecha, 1)));
    const delDia = turnos
        .filter((t) => Date.parse(t.inicio) < finDia && Date.parse(t.fin) > inicioDia)
        .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
    if (delDia.length === 0) return <span className="sr-only">Sin turno</span>;

    return (
        <ul className="space-y-1">
            {delDia.map((turno) => {
                const inicio = Date.parse(turno.inicio) < inicioDia ? '00:00' : turno.hora_inicio;
                const fin = Date.parse(turno.fin) >= finDia ? '00:00' : turno.hora_fin;
                return (
                    <li key={turno.id} className="rounded-sm border border-primary-200 bg-primary-soft px-1.5 py-1 text-xs leading-4 text-primary-ink">
                        <span className="block font-semibold tabular">
                            <span className="whitespace-nowrap">{horaLegible(inicio)}</span>
                            {' – '}
                            <span className="whitespace-nowrap">{horaLegible(fin)}</span>
                        </span>
                        <span className="block break-words">{turno.area}</span>
                        <span className="block">{TIPOS_TURNO[turno.tipo_turno]}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default function TurnosPage() {
    const hoy = fechaHospital();
    const lunesActual = lunesDe(hoy);
    const [lunes, setLunes] = useState(() => lunesDe(fechaHospital()));
    const [vista, setVista] = useState<'persona' | 'area'>('persona');
    const [filtroArea, setFiltroArea] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroPersonas, setFiltroPersonas] = useState<OpcionPersonal[]>([]);
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [turnoGuardado, setTurnoGuardado] = useState(false);
    const semana = useResource(() => listarTurnos(lunes, sumarDias(lunes, 7)), [lunes]);
    const turnos = semana.data ?? [];
    const areas = [...new Set(turnos.map((t) => t.area))].sort((a, b) => a.localeCompare(b, 'es'));
    const tipos = [...new Set(turnos.map((t) => t.tipo_personal))].sort((a, b) => a.localeCompare(b, 'es'));
    const personas = new Map(filtroPersonas.map((p) => [p.id, p]));
    for (const turno of turnos) {
        personas.set(turno.personal_id, {
            id: turno.personal_id,
            nombre: `${turno.nombres} ${turno.apellidos}`,
            detalle: turno.tipo_personal,
        });
    }
    const opcionesPersonas = [...personas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const idsSeleccionados = new Set(filtroPersonas.map((p) => p.id));
    const filas = agruparTurnos(
        turnos.filter((t) =>
            (!filtroArea || t.area === filtroArea) &&
            (!filtroTipo || t.tipo_personal === filtroTipo) &&
            (idsSeleccionados.size === 0 || idsSeleccionados.has(t.personal_id)),
        ),
        vista === 'area',
    );
    const estadoTabla = semana.status === 'success' && filas.length === 0 ? 'empty' : semana.status;
    const periodo = formatoSemana.formatRange(fechaUTC(lunes), fechaUTC(sumarDias(lunes, 6)));

    function alternarPersona(persona: OpcionPersonal) {
        setFiltroPersonas((seleccion) => seleccion.some((p) => p.id === persona.id)
            ? seleccion.filter((p) => p.id !== persona.id)
            : [...seleccion, persona]);
    }

    function cambiarSemana(fecha: string) {
        setLunes(fecha);
        setFiltroArea('');
        setFiltroTipo('');
        setTurnoGuardado(false);
    }

    function alGuardar(fecha: string) {
        cambiarSemana(lunesDe(fecha));
        setFormularioAbierto(false);
        setTurnoGuardado(true);
        semana.refetch();
    }

    const nuevoTurno = (
        <Button onClick={() => { setTurnoGuardado(false); setFormularioAbierto(true); }}>
            <Plus /> Nuevo turno
        </Button>
    );

    const columnas: Column<FilaTurnos>[] = [
        {
            header: vista === 'area' ? 'Área · persona' : 'Persona · tipo',
            className: 'w-44 align-top',
            skeleton: 'w-28',
            cell: (f) => (
                <div className="py-1">
                    {f.area && <p className="text-xs font-semibold text-primary">{f.area}</p>}
                    <p className="font-semibold">{f.nombre}</p>
                    <Badge className="mt-1">{f.tipo}</Badge>
                </div>
            ),
        },
        ...Array.from({ length: 7 }, (_, i): Column<FilaTurnos> => {
            const fecha = sumarDias(lunes, i);
            const dia = formatoDia.format(fechaUTC(fecha));
            const esHoy = fecha === hoy;
            return {
                header: esHoy ? `${dia} · hoy` : dia,
                className: cn('px-2 align-top', esHoy && 'border-x border-primary-200 bg-primary-100'),
                headerClassName: esHoy ? 'bg-primary-ink font-bold text-primary-soft align-middle' : undefined,
                skeleton: 'w-full h-7',
                cell: (f) => <CeldaTurnos turnos={f.turnos} fecha={fecha} />,
            };
        }),
    ];

    return (
        <>
            <PageHeader title="Turnos" actions={nuevoTurno} />
            <section aria-label="Semana de turnos" className="mb-4 rounded-lg border border-border bg-card px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 aria-live="polite" className="text-2xl font-semibold tracking-tight text-primary-ink sm:text-3xl">
                        {periodo}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => cambiarSemana(sumarDias(lunes, -7))}>
                            <ChevronLeft /> Semana anterior
                        </Button>
                        <Button variant="outline" disabled={lunes === lunesActual} onClick={() => cambiarSemana(lunesActual)}>
                            Semana actual
                        </Button>
                        <Button variant="outline" onClick={() => cambiarSemana(sumarDias(lunes, 7))}>
                            Siguiente <ChevronRight />
                        </Button>
                    </div>
                </div>
            </section>
            <Toolbar>
                <SegmentedControl
                    label="Agrupar turnos"
                    value={vista}
                    onChange={setVista}
                    options={[
                        { value: 'persona', label: 'Por persona' },
                        { value: 'area', label: 'Por área' },
                    ]}
                />
                <Select aria-label="Área" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                    <option value="">Todas las áreas</option>
                    {areas.map((a) => <option key={a}>{a}</option>)}
                </Select>
                <Select aria-label="Tipo de personal" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                    <option value="">Todos los tipos de personal</option>
                    {tipos.map((t) => <option key={t}>{t}</option>)}
                </Select>
                <SelectorPersonal
                    etiqueta="Filtrar por persona"
                    texto={filtroPersonas.length === 0
                        ? 'Todas las personas'
                        : filtroPersonas.length === 1
                            ? personas.get(filtroPersonas[0].id)!.nombre
                            : `${filtroPersonas.length} personas seleccionadas`}
                    opciones={opcionesPersonas}
                    seleccion={[...idsSeleccionados]}
                    onSelect={alternarPersona}
                    onClear={() => setFiltroPersonas([])}
                />
            </Toolbar>

            {turnoGuardado && <Alert title="Turno registrado" className="mb-4" />}

            <DataTable
                label="Turnos de la semana"
                columns={columnas}
                rows={filas}
                status={estadoTabla}
                rowKey={(f) => f.id}
                onRetry={semana.refetch}
                fixedLayout
                empty={turnos.length === 0
                    ? { icon: CalendarX2, title: 'No hay turnos esta semana', action: nuevoTurno }
                    : { title: 'Sin coincidencias', description: 'Nadie tiene turnos con esos filtros.' }}
            />

            {formularioAbierto && (
                <TurnoFormDialog
                    fechaInicial={lunes === lunesActual ? hoy : lunes}
                    areas={areas}
                    onClose={() => setFormularioAbierto(false)}
                    onSaved={alGuardar}
                />
            )}
        </>
    );
}
