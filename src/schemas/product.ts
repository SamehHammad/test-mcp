import { z } from "zod";
import { slugSchema } from "./category";

export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
export const statusSchema = z.enum(PRODUCT_STATUSES);

const base = {
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  description: z.string().max(5000),
  priceCents: z.number().int().min(0).max(100_000_000),
  currency: z.string().trim().length(3).toUpperCase(),
  stock: z.number().int().min(0).max(10_000_000),
  imageUrl: z.string().url().max(2000).nullable(),
  status: statusSchema,
  categoryId: z.string().min(1).nullable(),
};

export const productCreateSchema = z.object({
  name: base.name,
  slug: base.slug.optional(),
  description: base.description.default(""),
  priceCents: base.priceCents,
  currency: base.currency.default("USD"),
  stock: base.stock.default(0),
  imageUrl: base.imageUrl.nullish(),
  status: base.status.default("DRAFT"),
  categoryId: base.categoryId.nullish(),
});

// No defaults here: only fields actually sent are updated.
export const productUpdateSchema = z.object({
  name: base.name.optional(),
  slug: base.slug.optional(),
  description: base.description.optional(),
  priceCents: base.priceCents.optional(),
  currency: base.currency.optional(),
  stock: base.stock.optional(),
  imageUrl: base.imageUrl.optional(),
  status: base.status.optional(),
  categoryId: base.categoryId.optional(),
});

export const productListSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  q: z.string().trim().max(100).optional(),
  status: statusSchema.optional(),
  categoryId: z.string().optional(),
});

export type ProductCreate = z.input<typeof productCreateSchema>;
export type ProductUpdate = z.input<typeof productUpdateSchema>;
export type ProductListInput = z.input<typeof productListSchema>;
