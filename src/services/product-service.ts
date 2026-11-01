import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  productCreateSchema,
  productListSchema,
  productUpdateSchema,
  type ProductCreate,
  type ProductListInput,
  type ProductUpdate,
} from "@/schemas/product";
import { ServiceError } from "./errors";
import { PRODUCTS_TAG, revalidateCatalog } from "./revalidate";
import { slugify } from "./slug";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  priceCents: true,
  currency: true,
  stock: true,
  imageUrl: true,
  status: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
  createdAt: true,
  updatedAt: true,
} as const;

export async function listProducts(input: ProductListInput = {}) {
  const { page, pageSize, q, status, categoryId } = productListSchema.parse(input);
  const where: Prisma.ProductWhereInput = {
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      select: productSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Public storefront listing: ACTIVE only, cached and tagged so writes invalidate it. */
export const listActiveProductsCached = unstable_cache(
  async () => (await listProducts({ status: "ACTIVE", pageSize: 50 })).items,
  ["public-active-products"],
  { tags: [PRODUCTS_TAG] },
);

export async function getProduct(ref: { id?: string; slug?: string }) {
  if (!ref.id && !ref.slug) throw new ServiceError("INVALID", "Provide id or slug");
  const p = await db.product.findUnique({
    where: ref.id ? { id: ref.id } : { slug: ref.slug },
    select: productSelect,
  });
  if (!p) throw new ServiceError("NOT_FOUND", "Product not found");
  return p;
}

export async function createProduct(input: ProductCreate) {
  const { slug, ...data } = productCreateSchema.parse(input);
  const p = await db.product.create({
    data: { ...data, slug: slug ?? slugify(data.name) },
    select: productSelect,
  });
  revalidateCatalog();
  return p;
}

export async function updateProduct(id: string, input: ProductUpdate) {
  const data = productUpdateSchema.parse(input);
  const p = await db.product.update({ where: { id }, data, select: productSelect });
  revalidateCatalog();
  return p;
}

export async function setProductStock(id: string, stock: number) {
  return updateProduct(id, { stock });
}

export async function deleteProduct(id: string, opts: { expectedName?: string } = {}) {
  const current = await getProduct({ id });
  if (opts.expectedName !== undefined && opts.expectedName !== current.name) {
    throw new ServiceError("INVALID", `expectedName does not match; the current name is "${current.name}"`);
  }
  await db.product.delete({ where: { id } });
  revalidateCatalog();
  return { id, name: current.name };
}

export async function getStoreStats() {
  const [byStatus, categories, active, lowStock] = await Promise.all([
    db.product.groupBy({ by: ["status"], _count: { _all: true } }),
    db.category.count(),
    db.product.findMany({ where: { status: "ACTIVE" }, select: { priceCents: true, stock: true } }),
    db.product.count({ where: { status: "ACTIVE", stock: { lte: 5 } } }),
  ]);
  return {
    productsByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    categories,
    activeInventoryUnits: active.reduce((n, p) => n + p.stock, 0),
    activeInventoryValueCents: active.reduce((n, p) => n + p.stock * p.priceCents, 0),
    activeLowStockCount: lowStock,
  };
}
