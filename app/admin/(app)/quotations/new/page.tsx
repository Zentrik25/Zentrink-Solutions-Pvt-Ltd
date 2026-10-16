import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { getSetting } from "@/lib/content/settings";
import { PageTitle } from "@/components/admin/shell";
import { QuotationForm } from "@/components/admin/quotation-form";
import { createQuotationAction } from "../actions";

function validUntilDate(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}

export const metadata: Metadata = { title: "New quotation" };

type Props = { searchParams: Promise<{ enquiry?: string }> };

export default async function NewQuotationPage({ searchParams }: Props) {
  await requirePage("quotations:write");
  const { enquiry: enquiryId } = await searchParams;
  const [settings, enquiry] = await Promise.all([
    getSetting("quotation"),
    enquiryId ? db().enquiry.findUnique({ where: { id: enquiryId } }) : null,
  ]);
  const valid = validUntilDate(settings.validityDays);
  return (
    <>
      <PageTitle title="New quotation" />
      <div className="max-w-4xl border border-steel-300 bg-white p-6">
        <QuotationForm
          action={createQuotationAction}
          submitLabel="Create quotation"
          defaults={{
            enquiryId: enquiry?.id,
            clientName: enquiry?.name ?? "",
            clientCompany: enquiry?.company ?? "",
            clientEmail: enquiry?.email ?? "",
            clientPhone: enquiry?.phone ?? "",
            clientAddress: "",
            projectTitle: enquiry ? `${enquiry.serviceLabel} - ${enquiry.location}` : "",
            taxName: settings.taxName,
            taxRate: String(settings.taxRate),
            validUntil: valid,
            terms: settings.terms,
            notes: "",
            items: [],
          }}
        />
      </div>
    </>
  );
}
