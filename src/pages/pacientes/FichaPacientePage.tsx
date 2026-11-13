import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { PageHeader } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState, ErrorState } from '@/components/ui/feedback-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResource } from '@/hooks/useResource';
import { CITAS_POR_PAGINA, listarCitasPaciente, obtenerFichaPaciente } from '@/services/pacientes.service';
import type { CitaPaciente, FichaPaciente } from '@/types/pacientes.types';

const formatoNacimiento = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeZone: 'UTC' });
const formatoCita = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/El_Salvador' });
const etiquetasSexo = { masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro' };
const columnasCitas: Column<CitaPaciente>[] = [
    {
        header: 'Fecha y hora',
        cell: (cita) => <time dateTime={cita.fecha_hora}>{formatoCita.format(new Date(cita.fecha_hora))}</time>,
    },
    { header: 'Profesional', cell: (cita) => `${cita.doctor_nombres} ${cita.doctor_apellidos}` },
    { header: 'Estado', cell: (cita) => <StatusBadge estado={cita.estado} /> },
];

function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
    return (
        <div>
            <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
            <dd className="mt-1 text-sm font-medium break-words">{valor || '—'}</dd>
        </div>
    );
}

function DatosPaciente({ paciente }: { paciente: FichaPaciente }) {
    const cama = paciente.hospitalizaciones[0]?.camas;
    return (
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <Card>
                <CardHeader title="Datos generales" action={<StatusBadge estado={paciente.activo ? 'activo' : 'inactivo'} />} />
                <CardContent className="pt-4">
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <Dato etiqueta="Expediente" valor={paciente.expedientes?.numero_expediente} />
                        <Dato etiqueta="Documento de identidad" valor={paciente.documento_identidad} />
                        <Dato etiqueta="Fecha de nacimiento" valor={paciente.fecha_nacimiento && formatoNacimiento.format(new Date(paciente.fecha_nacimiento))} />
                        <Dato etiqueta="Sexo" valor={paciente.sexo && etiquetasSexo[paciente.sexo]} />
                        <Dato etiqueta="Teléfono" valor={paciente.telefono} />
                        <Dato etiqueta="Dirección" valor={paciente.direccion} />
                        <Dato etiqueta="Contacto de emergencia" valor={paciente.contacto_emergencia} />
                        <Dato etiqueta="Teléfono de emergencia" valor={paciente.telefono_emergencia} />
                    </dl>
                </CardContent>
            </Card>
            <Card>
                <CardHeader title="Habitación actual" />
                <CardContent className="pt-4">
                    {cama ? (
                        <dl className="grid gap-4">
                            <Dato etiqueta="Habitación" valor={cama.habitaciones.codigo} />
                            <Dato etiqueta="Planta" valor={String(cama.habitaciones.planta)} />
                            <Dato etiqueta="Cama" valor={cama.codigo} />
                        </dl>
                    ) : <p className="text-sm text-muted-foreground">Sin hospitalización activa.</p>}
                </CardContent>
            </Card>
        </div>
    );
}

function CitasPaciente({ id }: { id: string }) {
    const [page, setPage] = useState(1);
    const citas = useResource(() => listarCitasPaciente(id, page), [id, page]);
    return (
        <section className="mt-5" aria-labelledby="citas-paciente">
            <h2 id="citas-paciente" className="mb-3 text-base font-semibold">Citas</h2>
            <DataTable
                label="Citas del paciente"
                columns={columnasCitas}
                rows={citas.data?.items}
                status={citas.status}
                rowKey={(cita) => cita.id}
                onRetry={citas.refetch}
                skeletonRows={3}
                empty={{ title: 'Sin citas registradas' }}
                footer={citas.data && citas.data.total > CITAS_POR_PAGINA && (
                    <Pagination page={page} pageSize={CITAS_POR_PAGINA} total={citas.data.total} onPageChange={setPage} />
                )}
            />
        </section>
    );
}

function FichaPaciente({ id }: { id: string }) {
    const { state } = useLocation();
    const ficha = useResource(() => obtenerFichaPaciente(id), [id]);
    const paciente = ficha.status === 'success' ? ficha.data : null;

    return (
        <>
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
                <Link to="/pacientes" state={state}><ArrowLeft /> Volver a pacientes</Link>
            </Button>
            <PageHeader title={paciente ? `${paciente.nombres} ${paciente.apellidos}` : 'Ficha del paciente'} />
            {ficha.status === 'loading' && <Skeleton className="h-48 w-full" role="status" aria-label="Cargando ficha del paciente" />}
            {ficha.status === 'error' && <ErrorState title="No se pudo cargar la ficha" onRetry={ficha.refetch} />}
            {ficha.status === 'empty' && <EmptyState title="Paciente no disponible" />}
            {paciente && (
                <>
                    <DatosPaciente paciente={paciente} />
                    <CitasPaciente id={id} />
                </>
            )}
        </>
    );
}

export default function FichaPacientePage() {
    const { id = '' } = useParams();
    return <FichaPaciente key={id} id={id} />;
}
