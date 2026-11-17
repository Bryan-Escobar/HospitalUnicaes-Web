export const ALFABETO_ES = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];

const variantes: Record<string, string> = {
    A: 'AÁ',
    E: 'EÉ',
    I: 'IÍ',
    O: 'OÓ',
    U: 'UÚÜ',
};

export function inicialesApellido(letra: string | undefined): string[] {
    if (!letra || !ALFABETO_ES.includes(letra)) return [];
    return [...(variantes[letra] ?? letra)];
}
