"use client";

import { createContext, useActionState, useContext, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
} | null;

const ErrorsContext = createContext<Record<string, string>>({});

/**
 * Posts to a Server Action without React resetting the form on failure, so
 * administrators never lose typed work to a validation error.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className,
  hideSubmit,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  hideSubmit?: boolean;
}) {
  const [state, run, pending] = useActionState(action, null);
  const [, start] = useTransition();
  return (
    <form
      className={cn("space-y-5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(() => run(fd));
      }}
    >
      {state?.error && (
        <div role="alert" className="border-l-4 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-800">
          {state.error}
        </div>
      )}
      {state?.ok && state.message && (
        <div role="status" className="border-l-4 border-accent bg-steel-100 p-3 text-sm font-semibold text-navy-900">
          {state.message}
        </div>
      )}
      <ErrorsContext.Provider value={state?.fieldErrors ?? {}}>{children}</ErrorsContext.Provider>
      {!hideSubmit && (
        <button
          type="submit"
          disabled={pending}
          className="border-2 border-accent bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-navy-950 hover:border-accent-strong hover:bg-accent-strong hover:text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      )}
    </form>
  );
}

const control =
  "w-full border-2 border-steel-300 bg-white px-3 py-2.5 text-sm text-charcoal-800 focus:border-navy-900 focus:outline-none aria-[invalid=true]:border-red-700";

function Wrap({ name, label, hint, children }: { name: string; label: string; hint?: string; children: ReactNode }) {
  const error = useContext(ErrorsContext)[name];
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-navy-900">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-steel-500">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput(props: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
}) {
  const error = useContext(ErrorsContext)[props.name];
  return (
    <Wrap name={props.name} label={props.label} hint={props.hint}>
      <input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        defaultValue={props.defaultValue ?? ""}
        required={props.required}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        aria-invalid={error ? true : undefined}
        className={control}
      />
    </Wrap>
  );
}

export function TextArea(props: { name: string; label: string; defaultValue?: string | null; rows?: number; hint?: string; maxLength?: number }) {
  const error = useContext(ErrorsContext)[props.name];
  return (
    <Wrap name={props.name} label={props.label} hint={props.hint}>
      <textarea
        id={props.name}
        name={props.name}
        rows={props.rows ?? 5}
        defaultValue={props.defaultValue ?? ""}
        maxLength={props.maxLength}
        aria-invalid={error ? true : undefined}
        className={control}
      />
    </Wrap>
  );
}

export function Select(props: {
  name: string;
  label: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
}) {
  const error = useContext(ErrorsContext)[props.name];
  return (
    <Wrap name={props.name} label={props.label} hint={props.hint}>
      <select id={props.name} name={props.name} defaultValue={props.defaultValue ?? ""} aria-invalid={error ? true : undefined} className={control}>
        {props.placeholder !== undefined && <option value="">{props.placeholder}</option>}
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-navy-900">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[#c2410c]" />
      {label}
    </label>
  );
}

export function CheckboxGroup({
  name,
  label,
  options,
  selected,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-navy-900">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-3 border border-steel-300 bg-white px-3 py-2 text-sm">
            <input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="size-4 accent-[#c2410c]" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
