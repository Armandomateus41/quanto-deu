import { createClient } from "@supabase/supabase-js"

export type ApiUser = {
  id: string
  email: string
  name: string
}

function getSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
}

function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  )
}

function displayName(user: {
  email?: string
  user_metadata?: Record<string, unknown>
}): string {
  const metadataName = user.user_metadata?.name

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim()
  }

  return user.email?.split("@")[0] || "Conta"
}

export async function requireUser(request: Request): Promise<ApiUser | null> {
  const url = getSupabaseUrl()
  const key = getSupabaseKey()

  if (!url || !key) {
    return null
  }

  const header = request.headers.get("authorization")
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : ""

  if (!token) {
    return null
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user?.id || !data.user.email) {
    return null
  }

  return {
    id: data.user.id,
    email: data.user.email.trim().toLowerCase(),
    name: displayName(data.user),
  }
}
