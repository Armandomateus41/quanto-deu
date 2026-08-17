import { neon } from "@neondatabase/serverless"

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getSql() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error("DATABASE_URL ausente.")
  }

  return neon(url)
}
