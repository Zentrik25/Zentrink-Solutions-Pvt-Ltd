import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ProsePage } from "@/components/ui/prose-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Zentrik Solutions (Pvt) Ltd collects, uses and protects personal information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPage() {
  return (
    <ProsePage
      title="Privacy policy"
      crumbLabel="Privacy Policy"
      updated="October 2026"
      intro="This policy explains what personal information we handle when you use this website or contact us, and how we protect it."
    >
      <p>
        {SITE.name} (&ldquo;Zentrik Solutions&rdquo;, &ldquo;we&rdquo;) is an electrical
        engineering company operating in Zimbabwe. You can contact us at{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> about any privacy matter.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Enquiry details.</strong> If you complete a project enquiry form, we collect your
          name, email address, telephone number, company name, project location, service required,
          timeline and project description.
        </li>
        <li>
          <strong>Direct communications.</strong> If you call, email or message us on WhatsApp, we
          receive the information you choose to give us.
        </li>
        <li>
          <strong>Technical data.</strong> Our hosting provider may process standard server and
          connection data, such as IP address and browser type, to deliver and secure the website.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your information to respond to your enquiry, prepare quotations, deliver services you
        request, and keep reasonable business records. We do not sell personal information.
      </p>

      <h2>Online enquiry form</h2>
      <p>
        Online enquiry submission is being connected. Until the website states that the form is
        active, information typed into the form is not stored or transmitted by us, and you should
        contact us by phone, email or WhatsApp instead.
      </p>

      <h2>WhatsApp and third parties</h2>
      <p>
        Links to WhatsApp open a conversation with us on a service operated by a third party, which
        has its own privacy practices. We may use service providers, such as hosting and email
        providers, to operate the website and handle enquiries. They may process information only to
        provide those services.
      </p>

      <h2>Retention and security</h2>
      <p>
        We keep enquiry and project information for as long as needed to respond to you, deliver
        work and meet legal or accounting obligations. We take reasonable steps to protect personal
        information against loss and unauthorised access.
      </p>

      <h2>Your rights</h2>
      <p>
        You may ask us to tell you what personal information we hold about you, to correct it, or to
        delete it where we are not required to keep it. We handle personal information in line with
        applicable Zimbabwean data protection law. Write to{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> to make a request.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. The date above shows when it was last changed. See also our{" "}
        <Link href="/terms-of-use">Terms of Use</Link>.
      </p>
    </ProsePage>
  );
}
