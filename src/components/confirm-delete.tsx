"use client";

import { useRef, useState, useTransition } from "react";
import { btnGhostCls } from "./ui";

export function ConfirmDelete({
  name,
  action,
}: {
  name: string;
  /** Returns an error message, or nothing on success. */
  action: () => Promise<{ error?: string } | void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <>
      <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => ref.current?.showModal()}>
        Delete
      </button>
      <dialog ref={ref} className="m-auto rounded-lg p-6 backdrop:bg-black/40">
        <p className="mb-1 font-medium">Delete &ldquo;{name}&rdquo;?</p>
        <p className="mb-4 text-sm text-neutral-600">This cannot be undone.</p>
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhostCls} onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            onClick={() =>
              start(async () => {
                const res = await action();
                if (res?.error) setError(res.error);
                else ref.current?.close();
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
