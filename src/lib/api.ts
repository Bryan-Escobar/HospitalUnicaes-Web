import { supabase } from '@/lib/client';

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api').replace(/\/+$/, '');

// Error de validación de un campo (400 VALIDACION): { field: 'email', message: '…' }.
export interface ApiFieldError {
    field: string;
    message: string;
}

// Error con el formato estándar de la API: { statusCode, success: false, code, message, errors? }.
export class ApiError extends Error {
    readonly status: number;
    readonly code: string | undefined;
    readonly errors: ApiFieldError[];

    constructor(status: number, code: string | undefined, message: string, errors: ApiFieldError[] = []) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.errors = errors;
    }
}

async function accessToken(): Promise<string | undefined> {
    // getSession() renueva el token si ya expiró, así que casi nunca llega un 401 por vencimiento.
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
}

async function enviar(path: string, init: RequestInit, token: string | undefined) {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(`${API_URL}${path}`, { ...init, headers });
}

/**
 * Llama a HospitalUnicaes-Api con el token de la sesión. Si la API responde 401 (token vencido o
 * revocado) renueva la sesión una vez y repite la petición, sin que el usuario lo note. Si la
 * renovación falla, cierra la sesión local: onAuthStateChange lleva al login.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res = await enviar(path, init, await accessToken());

    if (res.status === 401) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
            await supabase.auth.signOut({ scope: 'local' });
            throw new ApiError(401, 'NO_AUTENTICADO', 'Tu sesión expiró. Inicia sesión de nuevo.');
        }
        res = await enviar(path, init, data.session.access_token);
    }

    const body = (await res.json().catch(() => null)) as
        | { data?: T; code?: string; message?: string; errors?: ApiFieldError[] }
        | null;
    if (!res.ok) {
        throw new ApiError(res.status, body?.code, body?.message ?? `Error ${res.status} al llamar a la API.`, body?.errors);
    }
    return body?.data as T;
}
