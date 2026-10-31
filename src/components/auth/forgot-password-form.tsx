import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isDemoMode, supabase } from '@/lib/client'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!isDemoMode) {
        // La URL debe estar permitida en Supabase > Auth > URL Configuration
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        })
        if (error) throw error
      }
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocurrió un error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl leading-8 font-semibold">Recuperar contraseña</h1>
      {success ? (
        <Alert className="mt-5" title="Revisa tu correo">
          Si el correo está registrado, recibirás un enlace para restablecer la contraseña.
        </Alert>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Escribe el correo de tu cuenta y te enviaremos un enlace.</p>
          <form onSubmit={handleForgotPassword} className="mt-6 flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hospital.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="animate-spin" />}
              {isLoading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        </>
      )}
      <Link to="/login" className="mt-5 block text-center text-sm text-primary hover:underline">
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  )
}
