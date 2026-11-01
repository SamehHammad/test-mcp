import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export type McpScope = "read" | "write" | "admin";
const LEVEL: Record<McpScope, number> = { read: 1, write: 2, admin: 3 };

type TokenEntry = { name: string; scope: McpScope; digest: Buffer };

const sha256 = (s: string) => createHash("sha256").update(s).digest();

function loadTokens(): TokenEntry[] {
  const entries: TokenEntry[] = [];
  for (const raw of (process.env.MCP_TOKENS ?? "").split(",")) {
    const entry = raw.trim();
    if (!entry) continue;
    // name:scope:token (the token itself may contain ":")
    const [name, scope, ...rest] = entry.split(":");
    const token = rest.join(":");
    if (!name || !token || !(scope in LEVEL)) {
      console.warn(`[mcp][auth] ignoring malformed MCP_TOKENS entry "${name || "?"}"`);
      continue;
    }
    entries.push({ name, scope: scope as McpScope, digest: sha256(token) });
  }
  return entries;
}

/** Used by withMcpAuth. Checks every entry (no short-circuit) with constant-time compares. */
export function verifyToken(_req: Request, bearerToken?: string): AuthInfo | undefined {
  if (!bearerToken) return undefined;
  const candidate = sha256(bearerToken);
  let match: TokenEntry | undefined;
  for (const entry of loadTokens()) {
    if (timingSafeEqual(candidate, entry.digest) && !match) match = entry;
  }
  if (!match) return undefined;
  // The raw token is deliberately not kept on the auth info.
  return { token: "[redacted]", clientId: match.name, scopes: [match.scope] };
}

export function callerName(auth?: AuthInfo) {
  return auth?.clientId ?? "unknown";
}

export function hasScope(auth: AuthInfo | undefined, needed: McpScope) {
  const best = Math.max(0, ...(auth?.scopes ?? []).map((s) => LEVEL[s as McpScope] ?? 0));
  return best >= LEVEL[needed];
}
