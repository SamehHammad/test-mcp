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
- `MCP_TOKENS` - comma-separated `name:scope:token`, e.g. `owner:admin:abc...,viewer:read:def...,editor:write:ghi...`.

Pages: `/` (ACTIVE products), `/login`, `/admin/products`, `/admin/categories`.

## MCP server

Endpoint: `http://localhost:3000/api/mcp` (Streamable HTTP, stateless, Bearer auth required).

### Generate a token

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it to `MCP_TOKENS` as `name:scope:<token>` and restart the server.

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

Scopes are cumulative: `read` < `write` < `admin`.

| Tool | Min scope | Purpose |
| --- | --- | --- |
| `get_store_stats` | read | Counts, stock and inventory value |
| `list_products` | read | Paginated list (max 50), filter by status/category |
| `search_products` | read | Text search; use first to get ids |
| `get_product` | read | One product by id or slug |
| `list_categories` | read | Categories with ids and product counts |
| `create_product` | write | Create a product (price in cents) |
| `update_product` | write | Partial update (only fields sent) |
| `set_product_stock` | write | Set absolute stock |
| `create_category` | write | Create a category |
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
