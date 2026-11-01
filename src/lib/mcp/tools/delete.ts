import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteCategory } from "@/services/category-service";
import { deleteProduct } from "@/services/product-service";
import { ServiceError } from "@/services/errors";
import { defineTool } from "../helpers";

/** Both delete tools demand explicit confirmation plus the exact current name. */
function requireConfirmation(confirm: boolean | undefined, expectedName: string | undefined, what: string) {
  const missing: string[] = [];
  if (confirm !== true) missing.push("confirm: true");
  if (!expectedName) missing.push(`expectedName (the exact current ${what} name)`);
  if (missing.length) {
    throw new ServiceError(
      "INVALID",
      `Refusing to delete: missing ${missing.join(" and ")}. Look the ${what} up first, tell the user what will be deleted, and only then retry with both.`,
    );
  }
}

export function registerDeleteTools(server: McpServer) {
  defineTool(server, {
    name: "delete_product",
    scope: "admin",
    hint: "delete",
    description:
      "PERMANENTLY delete a product. Irreversible. Prefer update_product with status=ARCHIVED unless the user explicitly wants it gone. Requires confirm=true AND expectedName equal to the product's current name (get both from search_products / get_product first; confirm with the user).",
    input: {
      id: z.string().min(1).describe("Product id from search_products"),
      confirm: z.boolean().optional().describe("Must be true"),
      expectedName: z.string().optional().describe("Exact current name of the product"),
    },
    run: ({ id, confirm, expectedName }) => {
      requireConfirmation(confirm, expectedName, "product");
      return deleteProduct(id, { expectedName });
    },
  });

  defineTool(server, {
    name: "delete_category",
    scope: "admin",
    hint: "delete",
    description:
      "PERMANENTLY delete an empty category. Refused if the category still has products (move them with update_product first). Requires confirm=true AND expectedName equal to the category's current name (get both from list_categories; confirm with the user).",
    input: {
      id: z.string().min(1).describe("Category id from list_categories"),
      confirm: z.boolean().optional().describe("Must be true"),
      expectedName: z.string().optional().describe("Exact current name of the category"),
    },
    run: ({ id, confirm, expectedName }) => {
      requireConfirmation(confirm, expectedName, "category");
      return deleteCategory(id, { expectedName });
    },
  });
}
