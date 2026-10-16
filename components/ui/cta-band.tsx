import { MessageCircle, Phone } from "lucide-react";
import { SITE, whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { ButtonLink, ExternalButton } from "./button";
import { Container } from "./container";

export function CtaBand({
  title = "Planning an electrical project?",
  text = "Tell us about the site, the scope and your timeline. We will respond with the information we need to prepare a quotation.",
  service,
}: {
  title?: string;
  text?: string;
  service?: string;
}) {
  const href = service ? `/request-a-quote?service=${service}` : "/request-a-quote";
  return (
    <section className="border-t-4 border-accent bg-navy-950 py-16 text-white lg:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-3xl font-extrabold uppercase leading-[1.05] sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-steel-300">
            {text}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <ButtonLink href={href}>Request a Project Quote</ButtonLink>
          <ExternalButton
            variant="outline-light"
            href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden className="size-4" />
            WhatsApp Us
          </ExternalButton>
          <ExternalButton variant="outline-light" href={SITE.phoneHref}>
            <Phone aria-hidden className="size-4" />
            {SITE.phone}
          </ExternalButton>
        </div>
      </Container>
    </section>
  );
}
