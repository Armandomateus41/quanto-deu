import { mkdirSync } from "node:fs"
import { build } from "esbuild"

mkdirSync("api", { recursive: true })

await build({
  entryPoints: ["server/vercel-handler.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "api/list.js",
  packages: "external",
  logLevel: "info",
})
