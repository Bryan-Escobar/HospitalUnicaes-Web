import { useContext, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthContext } from '@/context/AuthContext'
import { isDemoMode } from '@/lib/client'

// WEB-1 Login: solo cuentas con rol Administrador.
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { logIn, error, clearError, session } = useContext(AuthContext)

  // Si ya hay una sesión activa, redirigir al dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    clearError()

    try {
      await logIn({ email, password })
    } catch (error: unknown) {
      // El error ya está manejado en el contexto
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl leading-8 font-semibold">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-muted-foreground">Solo cuentas con rol Administrador.</p>

      {isDemoMode && (
        <Alert className="mt-5" title="Modo demostración">
          Supabase no está configurado: cualquier correo y contraseña abren el panel con datos de ejemplo.
        </Alert>
      )}

      <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@hospital.edu"
            required
            value={email}
            aria-invalid={!!error}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="pr-11"
              value={password}
              aria-invalid={!!error}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <Alert tone="danger" title="No se pudo iniciar sesión">
            {error === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error}
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <LoaderCircle className="animate-spin" />}
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </Button>
        <Link to="/forgot-password" className="text-center text-sm text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
    </AuthShell>
  )
}
