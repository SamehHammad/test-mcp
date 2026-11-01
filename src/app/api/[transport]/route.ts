import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyToken } from "@/lib/mcp/auth";
import { registerDeleteTools } from "@/lib/mcp/tools/delete";
import { registerReadTools } from "@/lib/mcp/tools/read";
import { registerWriteTools } from "@/lib/mcp/tools/write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createMcpHandler(
  (server) => {
    registerReadTools(server);
    registerWriteTools(server);
    registerDeleteTools(server);
  },
  { serverInfo: { name: "products-admin", version: "1.0.0" } },
  { basePath: "/api", disableSse: true },
);

const authed = withMcpAuth(handler, verifyToken, { required: true });

export { authed as GET, authed as POST, authed as DELETE };
