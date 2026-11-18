import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { patronHora12 } from '@/lib/fechas-hospital';

export function InputHora(props: Omit<ComponentProps<typeof Input>, 'type' | 'pattern'>) {
    return (
        <Input
            type="text"
            pattern={patronHora12}
            placeholder="Ej. 3:00 PM"
            title="Escribe la hora con AM o PM, por ejemplo, 3:00 PM."
            autoComplete="off"
            {...props}
        />
    );
}
