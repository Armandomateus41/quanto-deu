export type AuthErrorContext = "login" | "signup" | "reset" | "update"

type AuthErrorLike = {
  code?: string
  message?: string
}

export function mapAuthError(
  error: AuthErrorLike,
  context: AuthErrorContext,
): string {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha inválidos."
    case "email_not_confirmed":
      return "Confirme o e-mail antes de entrar."
    case "user_already_exists":
    case "email_exists":
      return "Este e-mail já está cadastrado."
    case "weak_password":
      return "A senha é muito fraca. Use pelo menos 6 caracteres."
    case "same_password":
      return "A nova senha deve ser diferente da atual."
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "over_sms_send_rate_limit":
      return "Muitas tentativas. Aguarde um momento e tente de novo."
    case "session_not_found":
      return "Sessão expirada. Entre novamente."
    case "validation_failed":
      return context === "reset" || context === "signup"
        ? "Informe um e-mail válido."
        : "Não foi possível validar os dados."
    default:
      break
  }

  if (context === "login") {
    return "Não foi possível entrar. Tente novamente."
  }

  if (context === "signup") {
    return "Não foi possível criar a conta. Tente novamente."
  }

  if (context === "update") {
    return "Não foi possível atualizar a senha. Tente novamente."
  }

  return "Não foi possível enviar o e-mail. Tente novamente."
}
