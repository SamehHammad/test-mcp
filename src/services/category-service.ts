import { db } from "@/lib/db";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreate,
  type CategoryUpdate,
} from "@/schemas/category";
import { ServiceError } from "./errors";
import { revalidateCatalog } from "./revalidate";
import { slugify } from "./slug";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  _count: { select: { products: true } },
} as const;

export async function listCategories() {
  return db.category.findMany({ select: categorySelect, orderBy: { name: "asc" } });
}

export async function getCategory(id: string) {
  const c = await db.category.findUnique({ where: { id }, select: categorySelect });
  if (!c) throw new ServiceError("NOT_FOUND", "Category not found");
  return c;
}

export async function createCategory(input: CategoryCreate) {
  const data = categoryCreateSchema.parse(input);
  const c = await db.category.create({
    data: { name: data.name, slug: data.slug ?? slugify(data.name) },
    select: categorySelect,
  });
  revalidateCatalog();
  return c;
}

export async function updateCategory(id: string, input: CategoryUpdate) {
  const data = categoryUpdateSchema.parse(input);
  const c = await db.category.update({ where: { id }, data, select: categorySelect });
  revalidateCatalog();
  return c;
}

export async function deleteCategory(id: string, opts: { expectedName?: string } = {}) {
  const current = await getCategory(id);
  if (opts.expectedName !== undefined && opts.expectedName !== current.name) {
    throw new ServiceError("INVALID", `expectedName does not match; the current name is "${current.name}"`);
  }
  if (current._count.products > 0) {
    throw new ServiceError(
      "CONFLICT",
      `Category still has ${current._count.products} product(s); move or archive them first`,
    );
  }
  await db.category.delete({ where: { id } });
  revalidateCatalog();
  return { id, name: current.name };
}
