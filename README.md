# Quanto Deu?

Controle rápido de gastos durante uma compra. Informe o item, o preço e a quantidade; o app calcula subtotal e total em Real.

As contas usam Supabase Auth. A lista aberta de cada usuário fica no Neon (`purchases` + `purchase_items`). Uma cópia local é mantida neste navegador como cache e para migrar dados antigos.

## Requisitos

- Node.js 22+
- npm
- Projeto Supabase com Auth (e-mail/senha)
- Projeto Neon com o schema em `neon/migrations/001_init.sql`

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a chave publicável do Supabase.
3. Preencha `DATABASE_URL` do Neon. Essa variável é só do servidor. Não use prefixo `VITE_`.

```bash
cp .env.example .env.local
```

No painel do Supabase, em **Authentication → URL Configuration**:

- Site URL: `http://localhost:5173` em desenvolvimento, ou a URL da Vercel em produção
- Redirect URLs: `http://localhost:5173/**`, `http://localhost:5173/redefinir-senha` e as equivalentes do domínio de produção (`https://<projeto>.vercel.app/**`)

Se o cadastro exigir confirmação de e-mail, o usuário precisa abrir o link enviado. Para testar localmente sem e-mail, desative **Confirm email** em Authentication → Providers → Email.

## Como rodar

```bash
npm install
npm run dev
```

O Vite sobe a interface e a API em `/api`. Abra o endereço que o Vite mostrar. Crie uma conta em **Cadastro** ou entre com uma conta já existente.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Desenvolvimento (UI + API) |
| `npm run start:api` | API isolada na porta 3001 |
| `npm run lint` | Lint |
| `npm run typecheck` | TypeScript |
| `npm test` | Testes unitários |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## Deploy (Vercel)

O frontend é o build do Vite (`dist`). A API `/api/list` sobe como função Node na Vercel, reexportando o app Hono.

Variáveis no projeto Vercel (Production, Preview e Development):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL` (somente servidor; marcar como sensitive)

O CI no GitHub (`/.github/workflows/ci.yml`) roda lint, typecheck, testes e build. Push na `main` faz deploy de produção na Vercel depois desses checks.

O deploy automático pelo Git da Vercel fica desligado em `vercel.json` para não publicar duas vezes. A publicação de produção passa pelo CI.

## O que o app faz

- Cadastro, login e recuperação de senha com e-mail real
- Adicionar item com preço (vírgula ou ponto) e quantidade
- Subtotal por item e total da compra (calculados, não gravados na lista aberta)
- Excluir item ou limpar a lista, com confirmação
- Sincronizar a lista aberta no Neon
- Migrar a lista antiga do Supabase ou deste dispositivo, se o Neon ainda estiver vazio
- Exportar e importar backup JSON
- Instalar como PWA

## Contas

A senha não fica salva em texto neste dispositivo. A sessão é do Supabase. Recuperação de senha envia um link por e-mail.

## Testes

```bash
npm test
```

Os testes cobrem parse de preço/quantidade, totais, persistência versionada, backup, erros de autenticação e o contrato da lista no servidor.
