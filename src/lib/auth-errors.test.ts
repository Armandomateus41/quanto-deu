import { describe, expect, it } from "vitest"
import { mapAuthError } from "./auth-errors"
import {
  emailErrorMessage,
  isValidEmail,
  passwordRequiredMessage,
  passwordStrengthMessage,
} from "./session"

describe("emailErrorMessage", () => {
  it("valida e-mail vazio e inválido", () => {
    expect(emailErrorMessage("")).toBe("Informe o e-mail.")
    expect(emailErrorMessage("a@b")).toBe("Informe um e-mail válido.")
    expect(emailErrorMessage("user@example.com")).toBeNull()
    expect(isValidEmail("user@example.com")).toBe(true)
  })
})

describe("password messages", () => {
  it("exige senha e o mínimo de 6 caracteres no cadastro", () => {
    expect(passwordRequiredMessage("")).toBe("Informe a senha.")
    expect(passwordRequiredMessage("123")).toBeNull()
    expect(passwordStrengthMessage("")).toBe("Informe a senha.")
    expect(passwordStrengthMessage("123")).toBe(
      "A senha deve ter no mínimo 6 caracteres.",
    )
    expect(passwordStrengthMessage("123456")).toBeNull()
  })
})

describe("mapAuthError", () => {
  it("traduz códigos conhecidos e usa fallback por contexto", () => {
    expect(mapAuthError({ code: "invalid_credentials" }, "login")).toBe(
      "E-mail ou senha inválidos.",
    )
    expect(mapAuthError({ code: "user_already_exists" }, "signup")).toBe(
      "Este e-mail já está cadastrado.",
    )
    expect(mapAuthError({ code: "email_not_confirmed" }, "login")).toBe(
      "Confirme o e-mail antes de entrar.",
    )
    expect(mapAuthError({ code: "unknown" }, "login")).toBe(
      "Não foi possível entrar. Tente novamente.",
    )
  })
})
