import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { ZodRawShape, z } from "zod";
import { explainError } from "@/services/errors";
import { callerName, hasScope, type McpAction } from "./auth";

export const ok = (data: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});

export const fail = (message: string): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: message }],
});

type Extra = { authInfo?: AuthInfo };

export function defineTool<S extends ZodRawShape>(
  server: McpServer,
  def: {
    name: string;
    description: string;
    needs: McpAction;
    input: S;
    hint?: "read" | "write" | "delete";
    run: (args: z.objectOutputType<S, z.ZodTypeAny>, who: string) => Promise<unknown>;
  },
) {
  const mutates = def.needs !== "read";
  server.registerTool(
    def.name,
    {
      description: def.description,
      inputSchema: def.input,
      annotations: {
        readOnlyHint: !mutates,
        destructiveHint: def.hint === "delete",
        idempotentHint: !mutates,
      },
    },
    (async (args: z.objectOutputType<S, z.ZodTypeAny>, extra: Extra) => {
      const who = callerName(extra.authInfo);
      try {
        if (!hasScope(extra.authInfo, def.needs)) {
          const have = extra.authInfo?.scopes[0] ?? "none";
          return fail(
            have === "read"
              ? `This token is read-only; "${def.name}" needs the ${def.needs} permission.`
              : `This token (scope: ${have}) is not allowed to ${def.needs} ("${def.name}").`
          );
        }
        if (mutates) {
          console.log(
            `[mcp][write] ${new Date().toISOString()} token=${who} tool=${def.name} input=${JSON.stringify(args)}`,
          );
        }
        return ok(await def.run(args, who));
      } catch (err) {
        const msg = explainError(err);
        if (msg) {
          console.warn(`[mcp][warn] tool=${def.name} token=${who}: ${msg}`);
          return fail(msg);
        }
        console.error(`[mcp][error] tool=${def.name} token=${who}:`, err instanceof Error ? err.message : err);
        return fail("Unexpected server error; the request was not completed.");
      }
    }) as never,
  );
}

/**
 * mcp-handler returns its Response before the tool has finished (the body is streamed).
 * Next flushes revalidateTag/revalidatePath calls when the route handler returns, so a
 * revalidation made inside a tool would land too late and be dropped. Draining the body
 * first makes sure tools (and their revalidations) complete inside the request.
 */
export function drainBeforeReturn(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    const res = await handler(req);
    if (req.method !== "POST" || !res.body) return res;
    const body = await res.arrayBuffer();
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
}
