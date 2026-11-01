"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProduct } from "@/app/admin/actions";
import { btnCls, btnGhostCls, Field, inputCls } from "./ui";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
  status: string;
  categoryId: string | null;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="id" defaultValue={product?.id ?? ""} />
      <Field label="Name">
        <input name="name" required defaultValue={product?.name} className={inputCls} />
      </Field>
      <Field label="Slug (optional, derived from name)">
        <input name="slug" defaultValue={product?.slug} className={inputCls} />
      </Field>
      <Field label="Description">
        <textarea name="description" rows={3} defaultValue={product?.description} className={inputCls} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Price">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
            className={inputCls}
          />
        </Field>
        <Field label="Currency">
          <input name="currency" maxLength={3} defaultValue={product?.currency ?? "USD"} className={inputCls} />
        </Field>
        <Field label="Stock">
          <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} className={inputCls} />
        </Field>
      </div>
      <Field label="Image URL">
        <input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select name="status" defaultValue={product?.status ?? "DRAFT"} className={inputCls}>
            <option>ACTIVE</option>
            <option>DRAFT</option>
            <option>ARCHIVED</option>
          </select>
        </Field>
        <Field label="Category">
          <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={inputCls}>
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button className={btnCls} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <Link href="/admin/products" className={btnGhostCls}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
