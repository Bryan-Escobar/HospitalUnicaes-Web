import { BrandMark } from '@/components/layout/BrandMark';

export function LoadingScreen({ mensaje = 'Restaurando sesión…' }: { mensaje?: string }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background" role="status">
            <div className="flex flex-col items-center text-center">
                <BrandMark className="size-14" />
                <h1 className="mt-4 text-xl font-semibold">HospitalUnicaes</h1>
                <p className="mt-1 text-sm text-muted-foreground">{mensaje}</p>
            </div>
        </div>
    );
}
