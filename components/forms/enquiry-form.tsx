"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Paperclip } from "lucide-react";
import { submitEnquiryAction } from "@/lib/enquiry/actions";
import { BUDGET_OPTIONS, type ServiceOption } from "@/lib/enquiry/constants";
import { trackEvent } from "@/lib/analytics";
import type { EnquiryActionState, EnquiryFieldName } from "@/lib/enquiry/schema";
import { SubmitButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full border-2 border-steel-300 bg-white px-4 py-3 text-base text-charcoal-800 placeholder:text-steel-500 focus:border-navy-900 focus:outline-none aria-[invalid=true]:border-red-700";

const MAX_FILES = 3;
const MAX_FILE = 3 * 1024 * 1024;
const MAX_TOTAL = 4 * 1024 * 1024;

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-navy-900">
        {label}
        {required ? (
          <span className="text-accent-strong" aria-hidden>
            {" "}*
          </span>
        ) : (
          <span className="font-normal text-steel-500"> (optional)</span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-steel-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function EnquiryForm({
  serviceOptions,
  defaultService = "",
}: {
  serviceOptions: ServiceOption[];
  defaultService?: string;
}) {
  const initial: EnquiryActionState = { status: "idle", values: { service: defaultService }, errors: {} };
  const [state, action, pending] = useActionState(submitEnquiryAction, initial);
  const [token, setToken] = useState("");
  const [fileError, setFileError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const lastService = useRef(defaultService);
  const values = state.values;
  const errors = state.errors;

  // A signed timestamp is fetched when the visitor first interacts with the form (keeping
  // the page load lean) and again after every failed attempt, so cached pages never carry a
  // stale token.
  const [interacted, setInteracted] = useState(false);
  useEffect(() => {
    if (!interacted) return;
    let cancelled = false;
    fetch("/api/form-token", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { token: string }) => !cancelled && setToken(d.token))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [state, interacted]);

  // Conversion event: carries only the form name and service slug, never personal details.
  useEffect(() => {
    if (state.status !== "success") return;
    trackEvent("generate_lead", { form: "project_enquiry", service: lastService.current || "unspecified" });
  }, [state.status]);

  const common = (id: EnquiryFieldName) => ({
    id,
    name: id,
    "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `${id}-error` : undefined,
  });

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const total = files.reduce((n, f) => n + f.size, 0);
    let msg = "";
    if (files.length > MAX_FILES) msg = `Attach at most ${MAX_FILES} files.`;
    else if (files.some((f) => f.size > MAX_FILE)) msg = "Each file must be 3 MB or smaller.";
    else if (total > MAX_TOTAL) msg = "Attachments must total 4 MB or less.";
    setFileError(msg);
    if (msg) e.target.value = "";
  }

  if (state.status === "success") {
    return (
      <div role="status" className="border-l-4 border-accent bg-steel-100 p-8">
        <CheckCircle2 aria-hidden className="size-8 text-accent-strong" />
        <h3 className="mt-4 text-2xl font-extrabold uppercase text-navy-900">Enquiry received</h3>
        <p className="mt-3 text-lg text-charcoal-800">
          Your reference number is{" "}
          <strong className="font-display text-xl text-navy-900">{state.reference}</strong>.
        </p>
        <p className="mt-3 leading-relaxed text-charcoal-700">
          Your enquiry has been saved and our team has been notified. We will also send a confirmation
          email to the address you gave; if it does not arrive within a few minutes, check your spam
          folder. Quote this reference in any correspondence.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-6"
      aria-label="Project enquiry form"
      onFocus={() => setInteracted(true)}
      onChange={(e) => {
        const t = e.target as unknown as HTMLSelectElement;
        if (t.name === "service") lastService.current = t.value;
      }}
    >
      {state.status === "error" && (
        <div role="alert" className="border-l-4 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {state.message}
        </div>
      )}
      {state.status === "invalid" && (
        <div role="alert" className="border-l-4 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Please correct the highlighted fields and submit again.
        </div>
      )}

      <input type="hidden" name="formToken" value={token} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name}>
          <input {...common("name")} type="text" required minLength={2} maxLength={100} autoComplete="name" defaultValue={values.name} className={inputClass} />
        </Field>
        <Field id="company" label="Company" error={errors.company}>
          <input {...common("company")} type="text" maxLength={120} autoComplete="organization" defaultValue={values.company} className={inputClass} />
        </Field>
        <Field id="email" label="Email address" required error={errors.email}>
          <input {...common("email")} type="email" required maxLength={160} autoComplete="email" defaultValue={values.email} className={inputClass} />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone}>
          <input {...common("phone")} type="tel" maxLength={20} autoComplete="tel" defaultValue={values.phone} placeholder="+263 ..." className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="service" label="Service required" required error={errors.service}>
          <select {...common("service")} required defaultValue={values.service ?? ""} className={cn(inputClass, "appearance-none")}>
            <option value="" disabled>
              Select a service
            </option>
            {serviceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="location" label="Project location" required error={errors.location}>
          <input {...common("location")} type="text" required minLength={2} maxLength={160} defaultValue={values.location} placeholder="Town, suburb or site" className={inputClass} />
        </Field>
        <Field id="budget" label="Estimated budget (USD)" error={errors.budget}>
          <select {...common("budget")} defaultValue={values.budget ?? ""} className={cn(inputClass, "appearance-none")}>
            <option value="">Not sure yet</option>
            {BUDGET_OPTIONS.filter((b) => b.value !== "not-sure").map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="preferredStart" label="Preferred start date" error={errors.preferredStart}>
          <input {...common("preferredStart")} type="date" defaultValue={values.preferredStart} className={inputClass} />
        </Field>
      </div>

      <Field
        id="description"
        label="Project description"
        required
        error={errors.description}
        hint="Include the type of building or site, the work required, approximate size or load, and any constraints."
      >
        <textarea {...common("description")} required minLength={20} maxLength={3000} rows={7} defaultValue={values.description} className={inputClass} />
      </Field>

      <Field
        id="documents"
        label="Supporting documents"
        error={errors.documents ?? fileError}
        hint="Drawings, photos or specifications. PDF, JPG, PNG, DOCX or XLSX. Up to 3 files, 4 MB in total."
      >
        <div className="flex items-center gap-3 border-2 border-dashed border-steel-300 p-4">
          <Paperclip aria-hidden className="size-5 shrink-0 text-steel-500" />
          <input
            id="documents"
            name="documents"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
            onChange={onFiles}
            aria-invalid={errors.documents || fileError ? true : undefined}
            aria-describedby={errors.documents || fileError ? "documents-error" : undefined}
            className="w-full text-sm file:mr-4 file:border-0 file:bg-navy-900 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white"
          />
        </div>
      </Field>

      {/* Honeypot: hidden from people and assistive technology. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-charcoal-700">
          <input
            {...common("consent")}
            type="checkbox"
            value="yes"
            required
            className="mt-1 size-5 shrink-0 accent-[#c2410c]"
          />
          <span>
            I agree that Zentrik Solutions may store and use these details to respond to my
            enquiry, as described in the{" "}
            <a href="/privacy-policy" target="_blank" className="font-semibold underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-1.5 text-sm font-semibold text-red-700">
            {errors.consent}
          </p>
        )}
      </div>

      <SubmitButton pending={pending}>
        {pending ? "Submitting..." : "Submit Project Enquiry"}
      </SubmitButton>
    </form>
  );
}
