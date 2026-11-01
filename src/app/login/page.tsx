"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { btnCls, Field, inputCls } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <main className="mx-auto max-w-sm p-6 pt-24">
      <h1 className="mb-4 text-xl font-semibold">Admin login</h1>
      <form action={action} className="space-y-4">
        <Field label="Password">
          <input name="password" type="password" required autoFocus className={inputCls} />
        </Field>
        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
        <button className={btnCls} disabled={pending}>
          Sign in
        </button>
      </form>
    </main>
  );
}
