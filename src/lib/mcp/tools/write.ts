import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createCategory, updateCategory } from "@/services/category-service";
import { createProduct, setProductStock, updateProduct } from "@/services/product-service";
import { categoryCreateSchema } from "@/schemas/category";
import { productCreateSchema, productUpdateSchema } from "@/schemas/product";
import { defineTool } from "../helpers";

const idField = z.string().min(1).describe("Product id - get it from search_products first, never guess");

export function registerWriteTools(server: McpServer) {
  defineTool(server, {
    name: "create_product",
    scope: "write",
    hint: "write",
    description:
      "Create a new product. Prices are integers in cents (19.99 USD = 1999). New products default to status DRAFT; set status ACTIVE to show it on the public page. Use list_categories to get a categoryId. Search first to avoid creating duplicates.",
    input: productCreateSchema.shape,
    run: (args) => createProduct(args),
  });

  defineTool(server, {
    name: "update_product",
    scope: "write",
    hint: "write",
    description:
      "Update an existing product. Send ONLY the fields you want to change; omitted fields stay as they are. Get the id from search_products first. To hide a product, set status ARCHIVED (preferred over deleting). Use set_product_stock for stock-only changes.",
    input: { id: idField, ...productUpdateSchema.shape },
    run: ({ id, ...changes }) => updateProduct(id, changes),
  });

  defineTool(server, {
    name: "set_product_stock",
    scope: "write",
    hint: "write",
    description:
      "Set a product's stock to an exact number of units (absolute value, not a delta). Get the id from search_products first.",
    input: { id: idField, stock: z.number().int().min(0).max(10_000_000).describe("New absolute stock level") },
    run: ({ id, stock }) => setProductStock(id, stock),
  });

  defineTool(server, {
    name: "create_category",
    scope: "write",
    hint: "write",
    description: "Create a category. The slug is derived from the name if omitted. Check list_categories first to avoid duplicates.",
    input: categoryCreateSchema.shape,
    run: (args) => createCategory(args),
  });

  defineTool(server, {
    name: "update_category",
    scope: "write",
    hint: "write",
    description: "Rename a category or change its slug. Get the id from list_categories first. Send only fields to change.",
    input: {
      id: z.string().min(1).describe("Category id from list_categories"),
      name: categoryCreateSchema.shape.name.optional(),
      slug: categoryCreateSchema.shape.slug,
    },
    run: ({ id, ...changes }) => updateCategory(id, changes),
  });
}
