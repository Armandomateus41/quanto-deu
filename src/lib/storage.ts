export type StorageErrorReason = "quota" | "unavailable"

export class StorageError extends Error {
  readonly reason: StorageErrorReason

  constructor(reason: StorageErrorReason, message: string) {
    super(message)
    this.name = "StorageError"
    this.reason = reason
  }
}

function isQuotaError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const record = error as { name?: string; code?: number }

  return (
    record.name === "QuotaExceededError" ||
    record.code === 22 ||
    record.code === 1014
  )
}

export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    throw new StorageError(
      "unavailable",
      "Não foi possível ler os dados neste dispositivo.",
    )
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    if (isQuotaError(error)) {
      throw new StorageError(
        "quota",
        "O armazenamento deste dispositivo está cheio.",
      )
    }

    throw new StorageError(
      "unavailable",
      "Não foi possível salvar os dados neste dispositivo.",
    )
  }
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    throw new StorageError(
      "unavailable",
      "Não foi possível atualizar os dados neste dispositivo.",
    )
  }
}

export function storageErrorMessage(error: unknown, fallback: string): string {
  return error instanceof StorageError ? error.message : fallback
}
