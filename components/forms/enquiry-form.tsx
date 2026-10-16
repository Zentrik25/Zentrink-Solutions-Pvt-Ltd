"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { submitEnquiry } from "@/app/contact/actions";
import {
  SERVICE_OPTIONS,
  emptyValues,
  type EnquiryField,
  type EnquiryState,
} from "@/lib/enquiry";
import { SITE, whatsappLink } from "@/lib/site";
import { SubmitButton, ExternalButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const inputClass =
  "w-full border-2 border-steel-300 bg-white px-4 py-3 text-base text-charcoal-800 placeholder:text-steel-500 focus:border-navy-900 focus:outline-none aria-[invalid=true]:border-red-700";

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: EnquiryField;
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

export function EnquiryForm({ defaultService = "" }: { defaultService?: string }) {
  const initial: EnquiryState = {
    status: "idle",
    values: emptyValues(defaultService),
    errors: {},
  };
  const [state, action, pending] = useActionState(submitEnquiry, initial);
  const { values, errors } = state;

  const common = (id: EnquiryField) => ({
    id,
    name: id,
    "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `${id}-error` : undefined,
  });

  return (
    <form action={action} className="space-y-6" aria-label="Project enquiry form">
      {state.status === "invalid" && Object.keys(errors).length > 0 && (
        <div role="alert" className="border-l-4 border-red-700 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Please correct the highlighted fields and submit again.
        </div>
      )}

      {state.status === "unavailable" && (
        <div role="status" className="border-l-4 border-accent bg-steel-100 p-6">
          <h3 className="text-lg font-extrabold uppercase text-navy-900">
            Your enquiry has not been sent
          </h3>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            Online enquiry submission is not yet available, so no message has been delivered. Your
            details are valid and are still in the form below. Please send them to us directly by
            WhatsApp, email or phone.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ExternalButton
              href={whatsappLink(state.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden className="size-4" />
              Send via WhatsApp
            </ExternalButton>
            <ExternalButton variant="outline" href={`mailto:${SITE.email}`}>
              Email {SITE.email}
            </ExternalButton>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name}>
          <input
            {...common("name")}
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            defaultValue={values.name}
            className={inputClass}
          />
        </Field>
        <Field id="company" label="Company" error={errors.company}>
          <input
            {...common("company")}
            type="text"
            maxLength={120}
            autoComplete="organization"
            defaultValue={values.company}
            className={inputClass}
          />
        </Field>
        <Field id="email" label="Email address" required error={errors.email}>
          <input
            {...common("email")}
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            defaultValue={values.email}
            className={inputClass}
          />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone}>
          <input
            {...common("phone")}
            type="tel"
            maxLength={20}
            autoComplete="tel"
            defaultValue={values.phone}
            placeholder="+263 ..."
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="service" label="Service required" required error={errors.service}>
          <select
            {...common("service")}
            required
            defaultValue={values.service}
            className={cn(inputClass, "appearance-none")}
          >
            <option value="" disabled>
              Select a service
            </option>
            {SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="location" label="Project location" required error={errors.location}>
          <input
            {...common("location")}
            type="text"
            required
            minLength={2}
            maxLength={160}
            defaultValue={values.location}
            placeholder="Town, suburb or site"
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        id="description"
        label="Project description"
        required
        error={errors.description}
        hint="Include the type of building or site, the work required, approximate size or load, and your timeline."
      >
        <textarea
          {...common("description")}
          required
          minLength={20}
          maxLength={3000}
          rows={7}
          defaultValue={values.description}
          className={inputClass}
        />
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
            defaultChecked={values.consent === "yes"}
            className="mt-1 size-5 shrink-0 accent-[#c2410c]"
          />
          I agree that Zentrik Solutions may contact me about this enquiry using the details above.
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-1.5 text-sm font-semibold text-red-700">
            {errors.consent}
          </p>
        )}
      </div>

      <SubmitButton pending={pending}>
        {pending ? "Checking enquiry..." : "Submit Project Enquiry"}
      </SubmitButton>
    </form>
  );
}
