import { SiteChrome } from "@/components/layout/site-chrome";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Error 404"
        title="Page not found"
        intro="The page you are looking for does not exist or has moved."
      />
      <Section>
        <div className="flex flex-col gap-4 sm:flex-row">
          <ButtonLink href="/">Return Home</ButtonLink>
          <ButtonLink href="/services" variant="outline">
            View Services
          </ButtonLink>
          <ButtonLink href="/request-a-quote" variant="outline">
            Request a Quote
          </ButtonLink>
        </div>
      </Section>
    </SiteChrome>
  );
}
