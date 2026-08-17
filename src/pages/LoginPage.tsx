import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { AuthBrand, AuthLayout, AuthLoading } from "../components/AuthLayout"
import { PasswordField } from "../components/PasswordField"
import { TextField } from "../components/TextField"
import { useSession } from "../hooks/useSession"
import {
  emailErrorMessage,
  passwordRequiredMessage,
  signIn,
} from "../lib/session"
import { btnPrimary, linkBrand } from "../lib/ui"

type LoginErrors = {
  email: string | null
  password: string | null
  form: string | null
}

const emptyErrors: LoginErrors = { email: null, password: null, form: null }

export function LoginPage() {
  const navigate = useNavigate()
  const { ready, user, passwordRecovery } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>(emptyErrors)

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

    const nextErrors: LoginErrors = {
      email: emailErrorMessage(email),
      password: passwordRequiredMessage(password),
      form: null,
    }

    setErrors(nextErrors)

    if (nextErrors.email || nextErrors.password) {
      return
    }

    setSubmitting(true)

    try {
      const result = await signIn(email, password)

      if (!result.ok) {
        setErrors({ ...nextErrors, form: result.error })
        return
      }

      navigate("/", { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <AuthBrand description="Controle rápido das suas compras" />

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="login-email"
          name="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          error={errors.email}
          onChange={(event) => {
            const value = event.target.value
            setEmail(value)
            setErrors((current) =>
              current.email === null && current.form === null
                ? current
                : { ...current, email: emailErrorMessage(value), form: null },
            )
          }}
        />

        <PasswordField
          id="login-password"
          label="Senha"
          placeholder="Digite sua senha"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(value) => {
            setPassword(value)
            setErrors((current) =>
              current.password === null && current.form === null
                ? current
                : {
                    ...current,
                    password: passwordRequiredMessage(value),
                    form: null,
                  },
            )
          }}
        />

        {errors.form ? (
          <p className="text-[13px] text-red-400" role="alert">
            {errors.form}
          </p>
        ) : null}

        <div className="-mt-1 flex justify-end">
          <Link to="/recuperar-senha" className={linkBrand}>
            Esqueceu sua senha?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`${btnPrimary} mt-1 h-11 w-full disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-5 text-center text-[14px] text-muted">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className={linkBrand}>
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  )
}
