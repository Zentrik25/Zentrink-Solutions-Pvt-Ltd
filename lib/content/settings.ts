import { z } from "zod";
import { db } from "@/lib/server/db";
import { SITE } from "@/lib/site";

export const contactSettingsSchema = z.object({
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  whatsappNumber: z.string().trim().regex(/^\d{8,15}$/, "Digits only, with country code and no +."),
  address: z.string().trim().max(300).default(""),
  notificationEmail: z.string().trim().toLowerCase().pipe(z.email()),
});

export const homepageSettingsSchema = z.object({
  heroHeadline: z.string().trim().min(3).max(120),
  heroText: z.string().trim().min(10).max(400),
  introHeading: z.string().trim().min(3).max(160),
  introParagraphs: z.array(z.string().trim().min(1).max(800)).min(1).max(5),
  whyHeading: z.string().trim().min(3).max(120),
  why: z.array(z.object({ title: z.string().trim().min(1).max(80), text: z.string().trim().min(1).max(300) })).min(1).max(9),
});

export const seoSettingsSchema = z.object({
  titleSuffix: z.string().trim().max(80),
  defaultTitle: z.string().trim().min(3).max(70),
  defaultDescription: z.string().trim().min(10).max(170),
  ogImageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v) || /^\/[^\s/][^\s]*$/.test(v), "Use an https:// URL or a path starting with /.")
    .default(""),
});

export const quotationSettingsSchema = z.object({
  taxName: z.string().trim().min(1).max(30),
  taxRate: z.coerce.number().min(0).max(100),
  validityDays: z.coerce.number().int().min(1).max(365),
  terms: z.string().trim().min(10).max(4000),
  companyAddress: z.string().trim().max(300).default(""),
});

export type ContactSettings = z.infer<typeof contactSettingsSchema>;
export type HomepageSettings = z.infer<typeof homepageSettingsSchema>;
export type SeoSettings = z.infer<typeof seoSettingsSchema>;
export type QuotationSettings = z.infer<typeof quotationSettingsSchema>;

export const SETTING_SCHEMAS = {
  contact: contactSettingsSchema,
  homepage: homepageSettingsSchema,
  seo: seoSettingsSchema,
  quotation: quotationSettingsSchema,
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;

export const SETTING_DEFAULTS = {
  contact: {
    phone: SITE.phone,
    email: SITE.email,
    whatsappNumber: SITE.whatsappNumber,
    address: "",
    notificationEmail: SITE.email,
  },
  homepage: {
    heroHeadline: "Engineering reliable power solutions.",
    heroText: SITE.description,
    introHeading: "An electrical engineering company built on technical discipline.",
    introParagraphs: [
      "Zentrik Solutions (Pvt) Ltd is a Zimbabwean electrical engineering company. We design, install, test and maintain electrical systems for commercial, industrial, institutional and residential clients.",
      "Our approach is simple: understand the load, design to recognised practice, install carefully, and prove the result by testing before handover. Clients receive clear scopes, honest advice and the documentation to operate their installation with confidence.",
    ],
    whyHeading: "Why clients work with us.",
    why: [
      { title: "Engineered before installed", text: "Load, cable sizing and protection are worked out and documented before work starts on site." },
      { title: "Proven by testing", text: "Every installation is inspected and tested before energisation, and the results are recorded." },
      { title: "One accountable scope", text: "Design, supply, installation, testing and handover are covered under a defined scope you can review." },
      { title: "Safety led", text: "Safe isolation, suitable equipment and planned working practices are standard on every job." },
      { title: "Clear communication", text: "Plain advice, realistic programmes and straight answers, including when the answer is no." },
      { title: "Documentation you can use", text: "Test records, circuit schedules and as-installed information are supplied for your maintenance teams." },
    ],
  },
  seo: {
    titleSuffix: SITE.shortName,
    defaultTitle: "Electrical Engineering Company Zimbabwe | Zentrik Solutions",
    defaultDescription: SITE.description,
    ogImageUrl: "",
  },
  quotation: {
    taxName: "VAT",
    taxRate: 15,
    validityDays: 30,
    terms:
      "Prices are in US dollars and valid until the date shown. Payment terms are agreed before work begins. Variations to the scope are quoted and agreed in writing before they are carried out. This quotation is subject to a site assessment where required.",
    companyAddress: "",
  },
} satisfies { [K in SettingKey]: z.input<(typeof SETTING_SCHEMAS)[K]> };

export async function getSetting<K extends SettingKey>(key: K): Promise<z.output<(typeof SETTING_SCHEMAS)[K]>> {
  const row = await db().websiteSetting.findUnique({ where: { key } });
  const schema = SETTING_SCHEMAS[key] as z.ZodType;
  const parsed = schema.safeParse(row?.value);
  return (parsed.success ? parsed.data : SETTING_DEFAULTS[key]) as z.output<(typeof SETTING_SCHEMAS)[K]>;
}
