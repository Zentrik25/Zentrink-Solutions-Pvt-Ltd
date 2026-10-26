import { MessageCircle, Phone } from "lucide-react";
import { whatsappLink, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/site";
import { getContact } from "@/lib/data";
import { ButtonLink, ExternalButton } from "./button";
import { Container } from "./container";

export async function CtaBand({
  title = "Planning an electrical project?",
  text = "Tell us about the site, the scope and your timeline. We will respond with the information we need to prepare a quotation.",
  service,
}: {
  title?: string;
  text?: string;
  service?: string;
}) {
  const contact = await getContact();
  const href = service ? `/request-a-quote?service=${service}` : "/request-a-quote";
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 text-white lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-brand-gradient absolute -right-32 -top-40 h-[28rem] w-[34rem] -skew-y-[14deg] rounded-lg opacity-[0.22]" />
        <div className="absolute -right-6 bottom-6 h-16 w-[26rem] -skew-y-[14deg] rounded-lg bg-white opacity-[0.05]" />
      </div>
      <Container className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="t-h1 max-w-2xl !text-white">{title}</h2>
          <p className="t-lead mt-4 max-w-xl text-white/70">{text}</p>
        </div>
        <div className="flex flex-col gap-3 sm:max-w-sm">
          <ButtonLink href={href}>Request a Project Quote</ButtonLink>
          <ExternalButton
            variant="outline-light"
            href={whatsappLink(WHATSAPP_DEFAULT_MESSAGE, contact.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden className="size-4" />
            WhatsApp Us
          </ExternalButton>
          <ExternalButton variant="outline-light" href={contact.phoneHref}>
            <Phone aria-hidden className="size-4" />
            {contact.phone}
          </ExternalButton>
        </div>
      </Container>
    </section>
  );
}
