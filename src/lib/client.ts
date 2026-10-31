import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY as string | undefined;

// Sin credenciales de Supabase el panel arranca en modo demostración: el login acepta cualquier
// correo y las pantallas usan datos de ejemplo. Nunca se activa si el .env está configurado.
export const isDemoMode = !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id');

export const supabase = createClient(
    isDemoMode ? 'https://demo.invalid' : supabaseUrl!,
    isDemoMode ? 'demo' : supabaseKey!,
);
