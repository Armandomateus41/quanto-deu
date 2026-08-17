import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { AuthBrand, AuthLayout, AuthLoading } from "../components/AuthLayout"
import { PasswordField } from "../components/PasswordField"
import { TextField } from "../components/TextField"
import { useSession } from "../hooks/useSession"
import {
  emailErrorMessage,
  passwordStrengthMessage,
  signUp,
} from "../lib/session"
import { btnPrimary, linkBrand } from "../lib/ui"

type CadastroErrors = {
  name: string | null
  email: string | null
  password: string | null
  confirmPassword: string | null
  terms: string | null
  form: string | null
}

const emptyErrors: CadastroErrors = {
  name: null,
  email: null,
  password: null,
  confirmPassword: null,
  terms: null,
  form: null,
}

function nameErrorMessage(value: string): string | null {
  return value.trim() ? null : "Informe o nome."
}

function confirmPasswordErrorMessage(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return "Confirme a senha."
  }

  return password === confirmPassword ? null : "As senhas não coincidem."
}

export function CadastroPage() {
  const navigate = useNavigate()
  const { ready, user, passwordRecovery } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [errors, setErrors] = useState<CadastroErrors>(emptyErrors)

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

    const nextErrors: CadastroErrors = {
      name: nameErrorMessage(name),
      email: emailErrorMessage(email),
      password: passwordStrengthMessage(password),
      confirmPassword: confirmPasswordErrorMessage(password, confirmPassword),
      terms: acceptedTerms ? null : "Aceite os termos para continuar.",
      form: null,
    }

    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) {
      return
    }

    setSubmitting(true)

    try {
      const result = await signUp({
        name,
        email,
        password,
      })

      if (!result.ok) {
        const duplicate = result.error === "Este e-mail já está cadastrado."
        setErrors({
          ...nextErrors,
          email: duplicate ? result.error : null,
          form: duplicate ? null : result.error,
        })
        return
      }

      if (result.needsConfirmation) {
        setNeedsConfirmation(true)
        return
      }

      navigate("/", { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout compact>
      {needsConfirmation ? (
        <>
          <AuthBrand compact description="Sua conta já está quase pronta." />
          <div className="space-y-4">
            <p className="text-[14px] leading-6 text-muted">
              Enviamos um e-mail do Quanto Deu? para você. Abra a mensagem e
              toque em <span className="text-ink">Confirmar e-mail</span> para
              liberar o acesso.
            </p>
            <p className="text-[13px] leading-5 text-muted">
              Não encontrou? Confira o spam ou a lixeira. O assunto é
              “Confirme seu e-mail no Quanto Deu?”.
            </p>
            <p className="text-center text-[14px] text-muted">
              <Link to="/login" className={linkBrand}>
                Ir para o login
              </Link>
            </p>
          </div>
        </>
      ) : (
        <>
          <AuthBrand compact description="Crie sua conta e comece a anotar a compra." />

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit} noValidate>
          <TextField
            id="cadastro-name"
            name="name"
            type="text"
            label="Nome"
            autoComplete="name"
            placeholder="Seu nome"
            value={name}
            error={errors.name}
            onChange={(event) => {
              const value = event.target.value
              setName(value)
              setErrors((current) =>
                current.name === null
                  ? current
                  : { ...current, name: nameErrorMessage(value) },
              )
            }}
          />

          <TextField
            id="cadastro-email"
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
                current.email === null
                  ? current
                  : { ...current, email: emailErrorMessage(value) },
              )
            }}
          />

          <PasswordField
            id="cadastro-password"
            label="Senha"
            placeholder="Crie uma senha"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={(value) => {
              setPassword(value)
              setErrors((current) =>
                current.password === null
                  ? current
                  : { ...current, password: passwordStrengthMessage(value) },
              )
            }}
          />

          <PasswordField
            id="cadastro-confirm-password"
            label="Confirmar senha"
            placeholder="Confirme sua senha"
            autoComplete="new-password"
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value)
              setErrors((current) =>
                current.confirmPassword === null
                  ? current
                  : {
                      ...current,
                      confirmPassword: confirmPasswordErrorMessage(
                        password,
                        value,
                      ),
                    },
              )
            }}
          />

          <div className="space-y-1">
            <label className="flex items-start gap-2.5 text-[13px] leading-5 text-muted">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  const checked = event.target.checked
                  setAcceptedTerms(checked)
                  setErrors((current) =>
                    current.terms === null
                      ? current
                      : {
                          ...current,
                          terms: checked
                            ? null
                            : "Aceite os termos para continuar.",
                        },
                  )
                }}
                className="mt-0.5 size-4 accent-brand"
              />
              <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
            </label>
            {errors.terms ? (
              <p className="text-[13px] text-red-400" role="alert">
                {errors.terms}
              </p>
            ) : null}
          </div>

          {errors.form ? (
            <p className="text-[13px] text-red-400" role="alert">
              {errors.form}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={`${btnPrimary} h-11 w-full disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {submitting ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
        </>
      )}

      {needsConfirmation ? null : (
        <p className="mt-4 text-center text-[14px] text-muted">
          Já tem conta?{" "}
          <Link to="/login" className={linkBrand}>
            Entrar
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}
