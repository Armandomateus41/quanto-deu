import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { AuthBrand, AuthLayout, AuthLoading } from "../components/AuthLayout"
import { PasswordField } from "../components/PasswordField"
import { useSession } from "../hooks/useSession"
import { passwordStrengthMessage, updatePassword } from "../lib/session"
import { btnPrimary, linkBrand } from "../lib/ui"

function confirmPasswordErrorMessage(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return "Confirme a senha."
  }

  return password === confirmPassword ? null : "As senhas não coincidem."
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { ready, user, passwordRecovery } = useSession()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!ready) {
    return <AuthLoading />
  }

  if (!user) {
    return (
      <AuthLayout>
        <AuthBrand description="Abra o link enviado por e-mail para redefinir a senha." />
        <p className="mt-5 text-center text-[14px] text-muted">
          <Link to="/recuperar-senha" className={linkBrand}>
            Pedir um novo link
          </Link>
          {" · "}
          <Link to="/login" className={linkBrand}>
            Voltar ao login
          </Link>
        </p>
      </AuthLayout>
    )
  }

  if (!passwordRecovery) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextPasswordError = passwordStrengthMessage(password)
    const nextConfirmError = confirmPasswordErrorMessage(
      password,
      confirmPassword,
    )

    setPasswordError(nextPasswordError)
    setConfirmError(nextConfirmError)
    setFormError(null)

    if (nextPasswordError || nextConfirmError) {
      return
    }

    setSubmitting(true)

    try {
      const result = await updatePassword(password)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      navigate("/", { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthBrand description="Defina uma nova senha para a sua conta." />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="reset-password"
          label="Nova senha"
          placeholder="Crie uma senha"
          autoComplete="new-password"
          value={password}
          error={passwordError}
          onChange={(value) => {
            setPassword(value)
            setPasswordError((current) =>
              current === null ? current : passwordStrengthMessage(value),
            )
            setFormError(null)
          }}
        />

        <PasswordField
          id="reset-confirm-password"
          label="Confirmar senha"
          placeholder="Confirme a nova senha"
          autoComplete="new-password"
          value={confirmPassword}
          error={confirmError}
          onChange={(value) => {
            setConfirmPassword(value)
            setConfirmError((current) =>
              current === null
                ? current
                : confirmPasswordErrorMessage(password, value),
            )
            setFormError(null)
          }}
        />

        {formError ? (
          <p className="text-[13px] text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className={`${btnPrimary} h-11 w-full disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {submitting ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
    </AuthLayout>
  )
}
