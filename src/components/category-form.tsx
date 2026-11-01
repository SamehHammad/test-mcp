"use client";

import { useActionState } from "react";
import { saveCategory } from "@/app/admin/actions";
import { btnCls, inputCls } from "./ui";

export function CategoryForm() {
  const [state, action, pending] = useActionState(saveCategory, undefined);
  return (
    <form action={action} className="flex flex-wrap items-start gap-2">
      <input name="name" required placeholder="Name" className={`${inputCls} !w-48`} />
      <input name="slug" placeholder="slug (optional)" className={`${inputCls} !w-48`} />
      <button className={btnCls} disabled={pending}>
        Add category
      </button>
      {state?.error && <p className="w-full text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
