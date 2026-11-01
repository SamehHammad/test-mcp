# products-admin

Next.js 16 (App Router) product catalogue with a password-protected admin UI **and** an MCP server so Claude Desktop can manage products. Prisma 7 + Postgres (Neon), zod 3.25.

All business logic lives in `src/services/` (product + category). The admin UI (server actions) and the MCP tools both call those services, and each write revalidates the cached pages inside the service.

## Setup

```bash
npm install
cp .env.example .env      # fill in values
npx prisma migrate deploy # or: npx prisma migrate dev
npx prisma db seed
npm run dev
```

- `DATABASE_URL` - Postgres connection string. Prisma is configured in `prisma.config.ts`; the client uses `@prisma/adapter-pg`.
- `ADMIN_PASSWORD` - password for `/login`.
- `SESSION_SECRET` - random string (>= 32 chars) used to HMAC-sign the session cookie.
- `MCP_TOKEN_<NAME>` - one variable per token: `MCP_TOKEN_OWNER="admin:<token>"`, `MCP_TOKEN_CREATOR="create:<token>"`, `MCP_TOKEN_VIEWER="read:<token>"` (scope: read | create | write | admin). The audit-log name is the lowercased suffix. The old comma-separated `MCP_TOKENS=name:scope:token,...` still works.

Pages: `/` (ACTIVE products), `/login`, `/admin/products`, `/admin/categories`.

## MCP server

Endpoint: `http://localhost:3000/api/mcp` (Streamable HTTP, stateless, Bearer auth required).

### Generate a token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it as a new variable `MCP_TOKEN_<NAME>="<scope>:<token>"` and restart the server.

### Claude Desktop (`claude_desktop_config.json`)

Inside `"mcpServers"`:

```json
"products": {
  "command": "npx",
  "args": ["-y", "mcp-remote", "http://localhost:3000/api/mcp", "--header", "Authorization:${AUTH_HEADER}"],
  "env": { "AUTH_HEADER": "Bearer <TOKEN>" }
}
```

### Test with the Inspector

```bash
npx @modelcontextprotocol/inspector
```

Choose transport **Streamable HTTP**, URL `http://localhost:3000/api/mcp`, and add the header `Authorization: Bearer <TOKEN>`.

### Tools and minimum scope

Scopes: `read` = read only; `create` = read + create (no update, no delete); `write` = read + create + update; `admin` = everything incl. delete.

| Tool | Min scope | Purpose |
| --- | --- | --- |
| `get_store_stats` | read | Counts, stock and inventory value |
| `list_products` | read | Paginated list (max 50), filter by status/category |
| `search_products` | read | Text search; use first to get ids |
| `get_product` | read | One product by id or slug |
| `list_categories` | read | Categories with ids and product counts |
| `create_product` | create | Create a product (price in cents) |
| `update_product` | write | Partial update (only fields sent) |
| `set_product_stock` | write | Set absolute stock |
| `create_category` | create | Create a category |
| `update_category` | write | Rename / change slug |
| `delete_product` | admin | Needs `confirm: true` + `expectedName`; prefer status ARCHIVED |
| `delete_category` | admin | Needs `confirm: true` + `expectedName`; refused if it has products |

Every write/delete is logged: `[mcp][write] <ISO time> token=<name> tool=<tool> input=<json>`.

### Production notes

- Serve over **HTTPS** only; bearer tokens are sent on every request.
- Set `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `MCP_TOKENS` as env vars on the server (never commit them).
- One token per person/client; **revoke by deleting its entry** from `MCP_TOKENS` and restarting.
- Tokens are compared via SHA-256 digests with `timingSafeEqual`; the raw token is never kept or logged.
- `mcp-handler` 1.x returns a streaming response before the tool finishes, so `route.ts` drains it (`drainBeforeReturn`); otherwise revalidations made inside tools are dropped.

## Versions

`mcp-handler@1.1.0` + `@modelcontextprotocol/sdk@1.26.0` (exact pins; mcp-handler 2.x moved to a different package, `@modelcontextprotocol/server`), `zod@3.25.76`, `prisma` / `@prisma/client` 7.10.1.

## Deploy on Vercel

1. Import the repo in Vercel (framework: Next.js). Vercel runs the `vercel-build` script automatically:
   `prisma generate && prisma migrate deploy && next build` - so the Prisma client is generated and pending migrations are applied on every deploy.
2. In **Project Settings -> Environment Variables** add (do **not** commit a `.env`):
   - `DATABASE_URL` - Neon **pooled** connection string (used by the app)
   - `DIRECT_URL` - optional, Neon **direct** (non-pooled) string, used only by `prisma migrate`
   - `ADMIN_PASSWORD`, `SESSION_SECRET`
   - `MCP_TOKEN_OWNER="admin:<token>"`, `MCP_TOKEN_CREATOR="create:<token>"`, `MCP_TOKEN_VIEWER="read:<token>"` (generate new tokens for production)
3. Seed once from your machine if you want sample data: `npx prisma db seed` (with `DATABASE_URL` pointing at the target DB).
4. Point Claude Desktop / `mcp-remote` at `https://<your-domain>/api/mcp` with the token in the `Authorization: Bearer` header.

Notes: new migrations go in via `npx prisma migrate dev` locally and are committed; preview deployments also run `migrate deploy`, so give previews their own database (a Neon branch) if you don't want them touching production.
