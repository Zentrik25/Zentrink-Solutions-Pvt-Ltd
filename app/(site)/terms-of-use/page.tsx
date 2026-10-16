import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ProsePage } from "@/components/ui/prose-page";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms governing the use of the Zentrik Solutions (Pvt) Ltd website.",
  path: "/terms-of-use",
});

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms of use"
      crumbLabel="Terms of Use"
      updated="October 2026"
      intro="By using this website you agree to these terms. If you do not agree, please do not use the site."
    >
      <h2>About this website</h2>
      <p>
        This website is operated by {SITE.name}. It provides information about our electrical
        engineering services and a way to contact us.
      </p>

      <h2>No offer or contract</h2>
      <p>
        Information on this website is general and does not constitute a quotation, offer or
        contract. Any engineering work is subject to a written quotation, a defined scope and
        agreed terms with us.
      </p>

      <h2>Technical information</h2>
      <p>
        Articles and service descriptions are general guidance. Electrical installations vary, and
        decisions about design, safety and compliance must be based on the conditions of the site
        and the applicable standards and regulations. Do not carry out electrical work unless you are
        competent and authorised to do so.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The content, design and logo on this website belong to {SITE.name} or are used with
        permission. You may not copy or reuse them for commercial purposes without our written
        consent.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You must not misuse the website, attempt to gain unauthorised access, or submit false or
        harmful content through any form.
      </p>

      <h2>Liability</h2>
      <p>
        We aim to keep the website accurate and available but give no warranty that it is error-free
        or uninterrupted. To the extent the law allows, we are not liable for loss arising from use
        of, or reliance on, the website. External links are provided for convenience and we are not
        responsible for third-party content.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Zimbabwe.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        See also our <Link href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </ProsePage>
  );
}
