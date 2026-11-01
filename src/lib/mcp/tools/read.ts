import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listCategories } from "@/services/category-service";
import { getProduct, getStoreStats, listProducts } from "@/services/product-service";
import { statusSchema } from "@/schemas/product";
import { defineTool } from "../helpers";

export function registerReadTools(server: McpServer) {
  defineTool(server, {
    name: "get_store_stats",
    scope: "read",
    description:
      "Summary of the catalogue: product counts by status, category count, units in stock and inventory value (cents) for ACTIVE products, and how many ACTIVE products are low on stock (<=5). Use for overview questions.",
    input: {},
    run: () => getStoreStats(),
  });

  defineTool(server, {
    name: "list_products",
    scope: "read",
    description:
      "List products page by page (newest first, max 50 per page). Optionally filter by status or categoryId. To find a product by name or keyword use search_products instead. Each item includes its id, which other tools need.",
    input: {
      page: z.number().int().min(1).default(1).describe("1-based page number"),
      limit: z.number().int().min(1).max(50).default(20).describe("Items per page, max 50"),
      status: statusSchema.optional(),
      categoryId: z.string().optional().describe("Category id from list_categories"),
    },
    run: ({ page, limit, status, categoryId }) => listProducts({ page, pageSize: limit, status, categoryId }),
  });

  defineTool(server, {
    name: "search_products",
    scope: "read",
    description:
      "Search products by text (matches name, slug and description). ALWAYS use this first when the user mentions a product by name, to get its id before calling get_product, update_product, set_product_stock or delete_product. Never guess ids.",
    input: {
      query: z.string().trim().min(1).max(100).describe("Text to search for"),
      status: statusSchema.optional(),
      limit: z.number().int().min(1).max(50).default(10),
    },
    run: ({ query, status, limit }) => listProducts({ q: query, status, pageSize: limit }),
  });

  defineTool(server, {
    name: "get_product",
    scope: "read",
    description:
      "Get one product's full details by id OR slug (provide exactly one). If you only know the name, call search_products first.",
    input: {
      id: z.string().optional().describe("Product id from search_products or list_products"),
      slug: z.string().optional().describe("Product slug"),
    },
    run: ({ id, slug }) => getProduct({ id, slug }),
  });

  defineTool(server, {
    name: "list_categories",
    scope: "read",
    description:
      "List all categories with their ids, slugs and product counts. Use it to find a categoryId before creating or updating a product, or a category id before update_category / delete_category.",
    input: {},
    run: () => listCategories(),
  });
}
