"use client";

import { useActionState } from "react";
import { removeCategory, saveCategory } from "@/app/admin/actions";
import { ConfirmDelete } from "./confirm-delete";
import { btnGhostCls, inputCls } from "./ui";

export function CategoryRow({
  category,
}: {
  category: { id: string; name: string; slug: string; _count: { products: number } };
}) {
  const [state, action, pending] = useActionState(saveCategory, undefined);
  return (
    <tr className="border-t">
      <td className="p-2" colSpan={2}>
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={category.id} />
          <input name="name" required defaultValue={category.name} className={`${inputCls} !w-44`} />
          <input name="slug" defaultValue={category.slug} className={`${inputCls} !w-44`} />
          <button className={btnGhostCls} disabled={pending}>
            Save
          </button>
          {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
        </form>
      </td>
      <td className="p-2 text-sm">{category._count.products}</td>
      <td className="p-2 text-right">
        <ConfirmDelete name={category.name} action={removeCategory.bind(null, category.id, category.name)} />
      </td>
    </tr>
  );
}
