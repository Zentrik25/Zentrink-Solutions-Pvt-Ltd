"use client";

import { useActionState, useTransition } from "react";
import type { FormState } from "./form";

export function DeleteButton({ action, label = "Delete" }: { action: (p: FormState, fd: FormData) => Promise<FormState>; label?: string }) {
  const [state, run, pending] = useActionState(action, null);
  const [, start] = useTransition();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("This permanently deletes the item. Continue?")) start(() => run(new FormData()));
        }}
        className="border-2 border-red-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-700 hover:text-white disabled:opacity-60"
      >
        {pending ? "Deleting..." : label}
      </button>
      {state?.error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{state.error}</p>}
    </div>
  );
}
