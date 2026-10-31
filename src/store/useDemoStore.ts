import { create } from 'zustand';

// Vista previa de estados de datos para revisar el diseño sin backend.
// Se puede forzar con ?estado=carga|vacio|error en la URL o desde el selector de la barra superior.
export type DemoMode = 'datos' | 'carga' | 'vacio' | 'error';

const MODES: DemoMode[] = ['datos', 'carga', 'vacio', 'error'];

function initialMode(): DemoMode {
    const param = new URLSearchParams(window.location.search).get('estado');
    return MODES.includes(param as DemoMode) ? (param as DemoMode) : 'datos';
}

interface DemoState {
    mode: DemoMode;
    setMode: (mode: DemoMode) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
    mode: initialMode(),
    setMode: (mode) => set({ mode }),
}));
