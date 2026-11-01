import { ZodError } from "zod";

export type ServiceErrorCode = "NOT_FOUND" | "CONFLICT" | "INVALID";

export class ServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/** Maps known failures (service, zod, Prisma) to short readable messages; null if unexpected. */
export function explainError(err: unknown): string | null {
  if (err instanceof ServiceError) return err.message;
  if (err instanceof ZodError) {
    return "Invalid input: " + err.issues.map((i) => `${i.path.join(".") || "input"} ${i.message}`).join("; ");
  }
  const code = (err as { code?: unknown } | null)?.code;
  if (code === "P2025") return "Not found (check the id; use search_products or list_categories first)";
  if (code === "P2002") return "Already exists (a unique field such as slug is taken)";
  if (code === "P2003") return "Referenced record does not exist (check categoryId)";
  return null;
}
