export const ALFABETO_ES = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];

export function inicialApellido(apellido: string): string {
    const inicial = apellido.trimStart().normalize('NFC').toLocaleUpperCase('es-SV')[0] ?? '';
    const letra = inicial === 'Ñ' ? inicial : inicial.normalize('NFD').replace(/\p{M}/gu, '');
    return ALFABETO_ES.includes(letra) ? letra : '#';
}
