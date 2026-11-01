import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { ZodRawShape, z } from "zod";
import { explainError } from "@/services/errors";
import { callerName, hasScope, type McpScope } from "./auth";

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
    scope: McpScope;
    input: S;
    hint?: "read" | "write" | "delete";
    run: (args: z.objectOutputType<S, z.ZodTypeAny>, who: string) => Promise<unknown>;
  },
) {
  const mutates = def.scope !== "read";
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
        if (!hasScope(extra.authInfo, def.scope)) {
          const have = extra.authInfo?.scopes[0] ?? "none";
          return fail(
            have === "read"
              ? `This token is read-only; "${def.name}" needs the ${def.scope} scope.`
              : `This token (scope: ${have}) is not allowed to use "${def.name}"; it needs the ${def.scope} scope.`,
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
