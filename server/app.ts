import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { requireUser } from "./auth.ts"
import { isDatabaseConfigured } from "./db.ts"
import { listOpenItems, parseListBody, replaceOpenItems } from "./list.ts"

export const app = new Hono()

app.onError((error, context) => {
  if (error instanceof HTTPException) {
    return error.getResponse()
  }

  console.error(error)
  return context.json(
    { error: "Não foi possível sincronizar a lista." },
    500,
  )
})

app.get("/api/list", async (context) => {
  const user = await requireUser(context.req.raw)

  if (!user) {
    return context.json({ error: "Não autenticado." }, 401)
  }

  if (!isDatabaseConfigured()) {
    return context.json({ error: "Banco não configurado." }, 503)
  }

  const items = await listOpenItems(user)
  return context.json({ items })
})

app.put("/api/list", async (context) => {
  const user = await requireUser(context.req.raw)

  if (!user) {
    return context.json({ error: "Não autenticado." }, 401)
  }

  if (!isDatabaseConfigured()) {
    return context.json({ error: "Banco não configurado." }, 503)
  }

  const parsed = parseListBody(await context.req.json())

  if (!parsed.ok) {
    return context.json({ error: parsed.error }, 400)
  }

  await replaceOpenItems(user, parsed.items)
  return context.json({
    items: parsed.items,
    warning: parsed.warning,
  })
})
