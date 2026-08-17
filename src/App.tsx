import { Navigate, Route, Routes } from "react-router-dom"
import { AuthLoading } from "./components/AuthLayout"
import { useSession } from "./hooks/useSession"
import { CadastroPage } from "./pages/CadastroPage"
import { DashboardPage } from "./pages/DashboardPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { LoginPage } from "./pages/LoginPage"
import { ResetPasswordPage } from "./pages/ResetPasswordPage"

function RequireSession() {
  const { ready, user, passwordRecovery } = useSession()

  if (!ready) {
    return <AuthLoading />
  }

  if (passwordRecovery) {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <DashboardPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/" element={<RequireSession />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
