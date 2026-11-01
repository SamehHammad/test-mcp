import { revalidatePath, revalidateTag } from "next/cache";

export const PRODUCTS_TAG = "products";
export const CATEGORIES_TAG = "categories";

/** Called by every write in the service layer so the admin UI and MCP both refresh cached pages. */
export function revalidateCatalog() {
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
}
