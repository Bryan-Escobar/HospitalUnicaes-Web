import { useState } from 'react';

const PREDETERMINADAS = { ambulancia: true, stock: true };

export function useAlertasPanel(userId: string) {
    const key = `hu-alertas-panel:${userId}`;
    const [alertas, setAlertas] = useState(() => {
        try {
            const datos = JSON.parse(localStorage.getItem(key) ?? '{}');
            return {
                ambulancia: datos?.ambulancia !== false,
                stock: datos?.stock !== false,
            };
        } catch {
            return PREDETERMINADAS;
        }
    });

    function guardar(alerta: keyof typeof PREDETERMINADAS, activa: boolean) {
        const nuevas = { ...alertas, [alerta]: activa };
        localStorage.setItem(key, JSON.stringify(nuevas));
        setAlertas(nuevas);
    }

    return [alertas, guardar] as const;
}
