export function terminosLaboratorio(busqueda: string) {
    return busqueda.normalize('NFC').match(/[\p{L}\p{M}\p{N}'-]+/gu) ?? [];
}
