import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

const projectRef = process.env.SUPABASE_PROJECT_REF ?? "tstaaltqireoctnryrgl"
const token = process.env.SUPABASE_ACCESS_TOKEN

if (!token) {
  console.error(
    "Defina SUPABASE_ACCESS_TOKEN (ou rode `npx supabase login`) e execute de novo.",
  )
  process.exit(1)
}

const confirmation = await readFile(
  resolve("supabase/templates/confirmation.html"),
  "utf8",
)
const recovery = await readFile(
  resolve("supabase/templates/recovery.html"),
  "utf8",
)

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mailer_subjects_confirmation: "Confirme seu e-mail no Quanto Deu?",
      mailer_templates_confirmation_content: confirmation,
      mailer_subjects_recovery: "Redefina sua senha no Quanto Deu?",
      mailer_templates_recovery_content: recovery,
    }),
  },
)

if (!response.ok) {
  const body = await response.text()
  console.error(`Falha ao atualizar templates: ${response.status}\n${body}`)
  process.exit(1)
}

console.log("Templates de confirmação e recuperação atualizados no Supabase.")
