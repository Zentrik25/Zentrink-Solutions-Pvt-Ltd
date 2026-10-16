export const SITE = {
  name: "Zentrik Solutions (Pvt) Ltd",
  shortName: "Zentrik Solutions",
  headline: "Engineering Reliable Power Solutions.",
  description:
    "Professional electrical engineering, power distribution, solar energy and industrial electrical solutions for projects across Zimbabwe.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://zentriksolutions.com",
  phone: "+263 78 823 6186",
  phoneHref: "tel:+263788236186",
  email: "info@zentriksolutions.com",
  whatsappNumber: "263788236186",
  country: "Zimbabwe",
} as const;

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const WHATSAPP_DEFAULT_MESSAGE =
  "Hello Zentrik Solutions, I would like to discuss an electrical project.";

export type NavItem = { label: string; href: string };

export const NAV: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Industries", href: "/industries" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];
