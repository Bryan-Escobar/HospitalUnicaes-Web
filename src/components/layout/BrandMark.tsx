import { cn } from '@/lib/utils';

// Marca HospitalUnicaes: cuadro vino del sello UNICAES, aro oro y cruz médica blanca.
export function BrandMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" aria-hidden className={cn('size-9 shrink-0', className)}>
            <rect width="48" height="48" rx="12" fill="var(--color-vino-700)" />
            <circle cx="24" cy="24" r="14.5" fill="none" stroke="var(--color-oro-400)" strokeWidth="2.5" />
            <path d="M21 15h6v6h6v6h-6v6h-6v-6h-6v-6h6z" fill="#fff" />
        </svg>
    );
}

export function Brand({ subtitle = 'Panel administrativo', inverted = true }: { subtitle?: string; inverted?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <BrandMark />
            <div className="min-w-0 leading-tight">
                <p className={cn('text-[15px] font-bold', inverted ? 'text-white' : 'text-foreground')}>HospitalUnicaes</p>
                <p className={cn('truncate text-[11px]', inverted ? 'text-slate-300' : 'text-muted-foreground')}>{subtitle}</p>
            </div>
        </div>
    );
}
