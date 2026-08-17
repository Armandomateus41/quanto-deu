import { useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import { AuthBrand, AuthLayout, AuthLoading } from "../components/AuthLayout"
import { TextField } from "../components/TextField"
import { useSession } from "../hooks/useSession"
import { emailErrorMessage, requestPasswordReset } from "../lib/session"
import { btnPrimary, linkBrand } from "../lib/ui"

export function ForgotPasswordPage() {
  const { ready, user, passwordRecovery } = useSession()
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!ready) {
    return <AuthLoading />
  }

  if (passwordRecovery) {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextEmailError = emailErrorMessage(email)
    setEmailError(nextEmailError)
    setFormError(null)

    if (nextEmailError) {
      return
    }

    setSubmitting(true)

    try {
      const result = await requestPasswordReset(email)

      if (!result.ok) {
        setFormError(result.error)
        return
      }

      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthBrand description="Informe o e-mail da conta para receber o link de redefinição." />

      {sent ? (
        <div className="space-y-3" role="status">
          <p className="text-[14px] leading-6 text-ink">
            Se este e-mail estiver cadastrado, você vai receber uma mensagem do
            Quanto Deu? para escolher uma nova senha.
          </p>
          <p className="text-[13px] leading-5 text-muted">
            Confira a caixa de entrada e o spam. O assunto é “Redefina sua senha
            no Quanto Deu?”.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <TextField
            id="recover-email"
            name="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            error={emailError}
            onChange={(event) => {
              const value = event.target.value
              setEmail(value)
              setEmailError((current) =>
                current === null ? current : emailErrorMessage(value),
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
            {submitting ? "Enviando…" : "Enviar link"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[14px] text-muted">
        <Link to="/login" className={linkBrand}>
          Voltar ao login
        </Link>
        {" · "}
        <Link to="/cadastro" className={linkBrand}>
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
