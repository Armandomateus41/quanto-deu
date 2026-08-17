import { mapAuthError } from "./auth-errors"
import { isSupabaseConfigured, supabase } from "./supabase"

export const SESSION_CHANGE_EVENT = "quanto-deu-session-change"
export const MIN_PASSWORD_LENGTH = 6

export type SessionUser = {
  id: string
  email: string
  name: string
}

export type SessionSnapshot = {
  ready: boolean
  user: SessionUser | null
  passwordRecovery: boolean
}

const serverSnapshot: SessionSnapshot = {
  ready: false,
  user: null,
  passwordRecovery: false,
}

let snapshot: SessionSnapshot = serverSnapshot

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function emailErrorMessage(value: string): string | null {
  if (!value.trim()) {
    return "Informe o e-mail."
  }

  return isValidEmail(value) ? null : "Informe um e-mail válido."
}

export function passwordRequiredMessage(value: string): string | null {
  return value ? null : "Informe a senha."
}

export function passwordStrengthMessage(value: string): string | null {
  if (!value) {
    return "Informe a senha."
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
  }

  return null
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function notifySessionChange() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT))
}

function displayName(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const metadataName = user.user_metadata?.name

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim()
  }

  const email = user.email?.trim() ?? ""
  return email.split("@")[0] || "Conta"
}

function toSessionUser(user: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): SessionUser {
  return {
    id: user.id,
    email: normalizeEmail(user.email ?? ""),
    name: displayName(user),
  }
}

function sameSnapshot(left: SessionSnapshot, right: SessionSnapshot): boolean {
  return (
    left.ready === right.ready &&
    left.passwordRecovery === right.passwordRecovery &&
    left.user?.id === right.user?.id &&
    left.user?.email === right.user?.email &&
    left.user?.name === right.user?.name
  )
}

function setSnapshot(next: SessionSnapshot) {
  if (sameSnapshot(snapshot, next)) {
    return
  }

  snapshot = next
  notifySessionChange()
}

function applyAuthSession(
  event: string,
  user: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  } | null,
) {
  const passwordRecovery =
    event === "PASSWORD_RECOVERY"
      ? true
      : event === "SIGNED_OUT" || event === "USER_UPDATED"
        ? false
        : snapshot.passwordRecovery

  setSnapshot({
    ready: true,
    user: user ? toSessionUser(user) : null,
    passwordRecovery,
  })
}

if (typeof window !== "undefined" && isSupabaseConfigured()) {
  void supabase.auth.getSession().then(({ data }) => {
    applyAuthSession("INITIAL_SESSION", data.session?.user ?? null)
  })

  supabase.auth.onAuthStateChange((event, session) => {
    applyAuthSession(event, session?.user ?? null)
  })
} else if (typeof window !== "undefined") {
  setSnapshot({
    ready: true,
    user: null,
    passwordRecovery: false,
  })
}

export function getSessionSnapshot(): SessionSnapshot {
  return snapshot
}

export function getServerSessionSnapshot(): SessionSnapshot {
  return serverSnapshot
}

export function getSession(): SessionUser | null {
  return snapshot.user
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "O aplicativo ainda não está conectado ao servidor." }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  })

  if (error) {
    return { ok: false, error: mapAuthError(error, "login") }
  }

  if (!data.user) {
    return { ok: false, error: "Não foi possível entrar. Tente novamente." }
  }

  return { ok: true, user: toSessionUser(data.user) }
}

export async function signUp(input: {
  name: string
  email: string
  password: string
}): Promise<
  | { ok: true; needsConfirmation: true }
  | { ok: true; needsConfirmation: false; user: SessionUser }
  | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "O aplicativo ainda não está conectado ao servidor." }
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(input.email),
    password: input.password,
    options: {
      data: { name: input.name.trim() },
      emailRedirectTo: `${window.location.origin}/`,
    },
  })

  if (error) {
    return { ok: false, error: mapAuthError(error, "signup") }
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: "Este e-mail já está cadastrado." }
  }

  if (!data.session || !data.user) {
    return { ok: true, needsConfirmation: true }
  }

  return { ok: true, needsConfirmation: false, user: toSessionUser(data.user) }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "O aplicativo ainda não está conectado ao servidor." }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })

  if (error) {
    return { ok: false, error: mapAuthError(error, "reset") }
  }

  return { ok: true }
}

export async function updatePassword(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "O aplicativo ainda não está conectado ao servidor." }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { ok: false, error: mapAuthError(error, "update") }
  }

  clearPasswordRecovery()
  return { ok: true }
}

export function clearPasswordRecovery() {
  setSnapshot({
    ...snapshot,
    passwordRecovery: false,
  })
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    setSnapshot({
      ready: true,
      user: null,
      passwordRecovery: false,
    })
    return
  }

  await supabase.auth.signOut()
}
