import type * as React from 'react';

import { Brand } from '@/components/layout/BrandMark';

const CIFRAS = [
    { valor: 17, etiqueta: 'camas' },
    { valor: 11, etiqueta: 'habitaciones' },
    { valor: 1, etiqueta: 'ambulancia' },
];

// Panel de marca (vino UNICAES) + formulario. Usado por login y recuperación de contraseña.
export function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid min-h-screen grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section className="flex flex-col justify-between bg-vino-900 px-14 py-16 2xl:px-16" aria-label="HospitalUnicaes">
                <Brand subtitle="Panel administrativo · Hospital Universitario Central" />
                <div>
                    <p className="max-w-[520px] text-[40px] leading-[1.2] font-semibold tracking-tight text-white 2xl:text-[44px]">
                        Gestión hospitalaria en tiempo real.
                    </p>
                    <dl className="mt-8 grid max-w-[640px] grid-cols-3 gap-4">
                        {CIFRAS.map((c) => (
                            <div key={c.etiqueta} className="rounded-xl border border-oro-400/60 px-5 py-4">
                                <dt className="sr-only">{c.etiqueta}</dt>
                                <dd className="text-[32px] leading-9 font-bold text-oro-400 tabular">{c.valor}</dd>
                                <dd className="text-sm text-white/90">{c.etiqueta}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <p className="text-xs text-oro-400">Universidad Católica de El Salvador · UNICAES</p>
            </section>
            <main className="flex items-center justify-center bg-background px-8">
                <div className="w-full max-w-[440px] rounded-xl border border-border bg-card p-9">{children}</div>
            </main>
        </div>
    );
}
