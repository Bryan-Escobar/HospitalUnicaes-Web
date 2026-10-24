import { useEffect, useState } from 'react';

export type Tema = 'claro' | 'oscuro' | 'sistema';

const KEY = 'hu-tema';

function leerTema(): Tema {
    try {
        const t = localStorage.getItem(KEY);
        return t === 'claro' || t === 'oscuro' || t === 'sistema' ? t : 'claro';
    } catch {
        return 'claro';
    }
}

export function aplicarTema(tema: Tema = leerTema()) {
    const oscuro = tema === 'oscuro' || (tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', oscuro);
}

// Preferencia de tema del panel (se guarda en este navegador).
export function useTheme() {
    const [tema, setTema] = useState<Tema>(leerTema);

    useEffect(() => {
        try {
            localStorage.setItem(KEY, tema);
        } catch {
            // sin almacenamiento: el tema dura hasta recargar
        }
        aplicarTema(tema);
        if (tema !== 'sistema') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => aplicarTema('sistema');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [tema]);

    return [tema, setTema] as const;
}
