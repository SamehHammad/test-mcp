import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

export type McpScope = "read" | "create" | "write" | "admin";
export type McpAction = "read" | "create" | "update" | "delete";
/** What each scope may do. "create" = read + add only (no update, no delete). */
const GRANTS: Record<McpScope, McpAction[]> = {
  read: ["read"],
  create: ["read", "create"],
  write: ["read", "create", "update"],
  admin: ["read", "create", "update", "delete"],
};

type TokenEntry = { name: string; scope: McpScope; digest: Buffer };

const sha256 = (s: string) => createHash("sha256").update(s).digest();

function parseEntry(name: string, scope: string, token: string, out: TokenEntry[]) {
  if (!name || !token || !(scope in GRANTS)) {
    console.warn(`[mcp][auth] ignoring malformed token entry "${name || "?"}"`);
    return;
  }
  out.push({ name, scope: scope as McpScope, digest: sha256(token) });
}

/**
 * Tokens come from one env var each: MCP_TOKEN_<NAME>=<scope>:<token>
 * (name = lowercased suffix). The legacy MCP_TOKENS=name:scope:token,... list is still read too.
 */
function loadTokens(): TokenEntry[] {
  const entries: TokenEntry[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("MCP_TOKEN_") || !value) continue;
    const [scope, ...rest] = value.trim().split(":");
    parseEntry(key.slice("MCP_TOKEN_".length).toLowerCase(), scope, rest.join(":"), entries);
  }
  for (const raw of (process.env.MCP_TOKENS ?? "").split(/[,\n]/)) {
    if (!raw.trim()) continue;
    const [name, scope, ...rest] = raw.trim().split(":");
    parseEntry(name, scope, rest.join(":"), entries);
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

export function hasScope(auth: AuthInfo | undefined, needed: McpAction) {
  return (auth?.scopes ?? []).some((sc) => GRANTS[sc as McpScope]?.includes(needed));
}
