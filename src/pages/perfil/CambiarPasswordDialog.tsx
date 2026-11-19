import { useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/client';

export function CambiarPasswordDialog({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [password, setPassword] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const [codigo, setCodigo] = useState('');
    const [requiereCodigo, setRequiereCodigo] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    async function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
            setError('Usa al menos 8 caracteres, con una minúscula, una mayúscula y un número.');
            return;
        }
        if (password !== confirmacion) {
            setError('Las contraseñas deben coincidir.');
            return;
        }
        setError('');
        setEnviando(true);
        try {
            const { error } = await supabase.auth.updateUser({ password, nonce: requiereCodigo ? codigo.trim() : undefined });
            if (error?.code === 'reauthentication_needed' && !requiereCodigo) {
                const { error: errorCodigo } = await supabase.auth.reauthenticate();
                if (errorCodigo) throw errorCodigo;
                setRequiereCodigo(true);
                return;
            }
            if (error) throw error;
            onSave();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Dialog open onClose={() => { if (!enviando) onClose(); }} title="Cambiar contraseña"
            description="Usa al menos 8 caracteres, con una minúscula, una mayúscula y un número.">
            <form onSubmit={guardar}>
                <fieldset disabled={enviando} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="perfil-password">Nueva contraseña</Label>
                        <Input id="perfil-password" type="password" autoComplete="new-password" required
                            value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="perfil-password-confirmacion">Confirmar contraseña</Label>
                        <Input id="perfil-password-confirmacion" type="password" autoComplete="new-password" required
                            value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
                    </div>
                    {requiereCodigo && (
                        <div className="grid gap-2">
                            <Label htmlFor="perfil-password-codigo">Código enviado a tu correo</Label>
                            <Input id="perfil-password-codigo" inputMode="numeric" autoComplete="one-time-code" required
                                value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                        </div>
                    )}
                    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">
                            {enviando && <LoaderCircle className="animate-spin" />}
                            Guardar contraseña
                        </Button>
                    </div>
                </fieldset>
            </form>
        </Dialog>
    );
}
