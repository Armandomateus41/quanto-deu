import { serve } from "@hono/node-server"
import { app } from "./app.ts"
import { applyLocalServerEnv } from "./env.ts"

applyLocalServerEnv()

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API Quanto Deu? em http://127.0.0.1:${info.port}`)
})
