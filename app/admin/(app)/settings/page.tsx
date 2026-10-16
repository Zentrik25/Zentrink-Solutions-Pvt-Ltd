import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { getSetting } from "@/lib/content/settings";
import { pairsToText, toParagraphs } from "@/lib/content/parse";
import { ActionForm, TextArea, TextInput } from "@/components/admin/form";
import { Panel, PageTitle } from "@/components/admin/shell";
import { changePasswordAction, saveSettingAction } from "../content-actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePage("settings:write");
  const [contact, home, seo, quote] = await Promise.all([getSetting("contact"), getSetting("homepage"), getSetting("seo"), getSetting("quotation")]);
  return (
    <>
      <PageTitle title="Website settings" />
      <div className="grid max-w-5xl gap-6">
        <Panel title="Contact information">
          <ActionForm action={saveSettingAction.bind(null, "contact")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput name="phone" label="Telephone" defaultValue={contact.phone} required />
              <TextInput name="email" label="Public email" type="email" defaultValue={contact.email} required />
              <TextInput name="whatsappNumber" label="WhatsApp number" defaultValue={contact.whatsappNumber} hint="Digits only with country code, e.g. 263788236186" required />
              <TextInput name="notificationEmail" label="Enquiry notification email" type="email" defaultValue={contact.notificationEmail} hint="Where new enquiry alerts are sent." required />
            </div>
            <TextInput name="address" label="Address" defaultValue={contact.address} />
          </ActionForm>
        </Panel>
        <Panel title="Homepage content">
          <ActionForm action={saveSettingAction.bind(null, "homepage")}>
            <TextInput name="heroHeadline" label="Hero headline" defaultValue={home.heroHeadline} />
            <TextArea name="heroText" label="Hero supporting text" defaultValue={home.heroText} rows={3} />
            <TextInput name="introHeading" label="Introduction heading" defaultValue={home.introHeading} />
            <TextArea name="introParagraphs" label="Introduction paragraphs" defaultValue={toParagraphs(home.introParagraphs)} rows={7} hint="Separate paragraphs with a blank line." />
            <TextInput name="whyHeading" label="Why-us heading" defaultValue={home.whyHeading} />
            <TextArea name="why" label="Why-us points" defaultValue={pairsToText(home.why.map((w) => [w.title, w.text]))} rows={8} hint="One per line: Title | Description" />
          </ActionForm>
        </Panel>
        <Panel title="SEO defaults">
          <ActionForm action={saveSettingAction.bind(null, "seo")}>
            <TextInput name="defaultTitle" label="Default page title" defaultValue={seo.defaultTitle} maxLength={70} />
            <TextInput name="titleSuffix" label="Title suffix" defaultValue={seo.titleSuffix} hint="Appended to every page title." />
            <TextArea name="defaultDescription" label="Default meta description" defaultValue={seo.defaultDescription} rows={3} maxLength={170} />
            <TextInput name="ogImageUrl" label="Social sharing image URL (optional)" defaultValue={seo.ogImageUrl} />
          </ActionForm>
        </Panel>
        <Panel title="Quotation defaults">
          <ActionForm action={saveSettingAction.bind(null, "quotation")}>
            <div className="grid gap-5 sm:grid-cols-3">
              <TextInput name="taxName" label="Tax name" defaultValue={quote.taxName} />
              <TextInput name="taxRate" label="Tax rate (%)" defaultValue={quote.taxRate} />
              <TextInput name="validityDays" label="Validity (days)" type="number" defaultValue={quote.validityDays} />
            </div>
            <TextInput name="companyAddress" label="Address on quotations" defaultValue={quote.companyAddress} />
            <TextArea name="terms" label="Default terms and conditions" defaultValue={quote.terms} rows={6} />
          </ActionForm>
        </Panel>
        <Panel title="Change my password">
          <ActionForm action={changePasswordAction} submitLabel="Change password">
            <TextInput name="current" label="Current password" type="password" autoComplete="current-password" />
            <TextInput name="next" label="New password" type="password" autoComplete="new-password" hint="At least 12 characters with upper case, lower case and a number." />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
