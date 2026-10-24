import { Navigate, Route, Routes } from 'react-router-dom'

import { LoginForm } from './components/auth/login-form'
import { SignUpForm } from './components/auth/sign-up-form'
import { ForgotPasswordForm } from './components/auth/forgot-password-form'
import { UpdatePasswordForm } from './components/auth/update-password-form'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminLayout } from './components/layout/AdminLayout'
import Dashboard from './pages/dashboard/dashboard'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import PacientesPage from './pages/pacientes/PacientesPage'
import TurnosPage from './pages/turnos/TurnosPage'
import MapaPlantasPage from './pages/mapa/MapaPlantasPage'
import InventarioPage from './pages/inventario/InventarioPage'
import LaboratorioPage from './pages/laboratorio/LaboratorioPage'
import AmbulanciaPage from './pages/ambulancia/AmbulanciaPage'
import BitacoraPage from './pages/bitacora/BitacoraPage'
import AvisosPage from './pages/avisos/AvisosPage'
import ReportesPage from './pages/reportes/ReportesPage'
import PerfilPage from './pages/perfil/PerfilPage'


function App() {

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/sign-up" element={<SignUpForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/update-password" element={<UpdatePasswordForm />} />

        {/* Protected routes: panel del Administrador (WEB-2 a WEB-13) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/turnos" element={<TurnosPage />} />
            <Route path="/mapa-plantas" element={<MapaPlantasPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/laboratorio" element={<LaboratorioPage />} />
            <Route path="/ambulancia" element={<AmbulanciaPage />} />
            <Route path="/bitacora" element={<BitacoraPage />} />
            <Route path="/avisos" element={<AvisosPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
          {/* Redirect to dashboard for any other route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

      </Routes>
    </AuthProvider>
  );
}

export default App
