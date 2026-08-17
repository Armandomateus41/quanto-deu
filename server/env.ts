import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

export const serverEnvKeys = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const

function parseEnvFile(contents: string): Record<string, string> {
  const env: Record<string, string> = {}

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separator = trimmed.indexOf("=")

    if (separator === -1) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

export function applyLocalServerEnv(cwd = process.cwd()): void {
  const merged: Record<string, string> = {}

  for (const file of [".env", ".env.local"]) {
    const path = resolve(cwd, file)

    if (!existsSync(path)) {
      continue
    }

    Object.assign(merged, parseEnvFile(readFileSync(path, "utf8")))
  }

  for (const key of serverEnvKeys) {
    if (merged[key]) {
      process.env[key] = merged[key]
    }
  }
}
