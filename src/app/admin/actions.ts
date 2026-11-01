"use server";

import { redirect } from "next/navigation";
import { createCategory, deleteCategory, updateCategory } from "@/services/category-service";
import { explainError } from "@/services/errors";
import { createProduct, deleteProduct, updateProduct } from "@/services/product-service";

export type FormState = { error?: string } | undefined;

const text = (f: FormData, k: string) => String(f.get(k) ?? "");
const optional = (f: FormData, k: string) => text(f, k).trim() || null;

async function guard<T>(fn: () => Promise<T>): Promise<{ error: string } | T> {
  try {
    return await fn();
  } catch (err) {
    const msg = explainError(err);
    if (!msg) throw err;
    return { error: msg };
  }
}

export async function saveProduct(_: FormState, form: FormData): Promise<FormState> {
  const id = text(form, "id");
  const data = {
    name: text(form, "name"),
    slug: optional(form, "slug") ?? undefined,
    description: text(form, "description"),
    priceCents: Math.round(parseFloat(text(form, "price") || "0") * 100),
    currency: text(form, "currency") || "USD",
    stock: parseInt(text(form, "stock") || "0", 10),
    imageUrl: optional(form, "imageUrl"),
    status: text(form, "status") as "ACTIVE" | "DRAFT" | "ARCHIVED",
    categoryId: optional(form, "categoryId"),
  };
  const res = await guard(() => (id ? updateProduct(id, data) : createProduct(data)));
  if ("error" in res) return res;
  redirect("/admin/products");
}

export async function removeProduct(id: string, name: string): Promise<FormState> {
  const res = await guard(() => deleteProduct(id, { expectedName: name }));
  return "error" in res ? res : undefined;
}

export async function saveCategory(_: FormState, form: FormData): Promise<FormState> {
  const id = text(form, "id");
  const data = { name: text(form, "name"), slug: optional(form, "slug") ?? undefined };
  const res = await guard(() => (id ? updateCategory(id, data) : createCategory(data)));
  if ("error" in res) return res;
  redirect("/admin/categories");
}

export async function removeCategory(id: string, name: string): Promise<FormState> {
  const res = await guard(() => deleteCategory(id, { expectedName: name }));
  return "error" in res ? res : undefined;
}
