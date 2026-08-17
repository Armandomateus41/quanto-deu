import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { applyLocalServerEnv } from "./env.ts"

const originalDatabaseUrl = process.env.DATABASE_URL

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }
})

describe("applyLocalServerEnv", () => {
  it("sobrescreve DATABASE_URL global com o .env.local do projeto", () => {
    const dir = mkdtempSync(join(tmpdir(), "quanto-deu-env-"))
    writeFileSync(
      join(dir, ".env.local"),
      "DATABASE_URL=postgresql://neon.example/neondb\n",
    )

    process.env.DATABASE_URL = "postgresql://postgres@localhost:5432/other"
    applyLocalServerEnv(dir)

    expect(process.env.DATABASE_URL).toBe("postgresql://neon.example/neondb")
  })
})
