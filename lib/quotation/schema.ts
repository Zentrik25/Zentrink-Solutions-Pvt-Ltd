import { z } from "zod";

export const quotationItemSchema = z.object({
  description: z.string().trim().min(1, "Describe each item.").max(500),
  quantity: z.string().trim().min(1, "Enter a quantity."),
  unitPrice: z.string().trim().min(1, "Enter a unit price."),
});

export const quotationSchema = z.object({
  enquiryId: z.string().trim().min(1).optional(),
  clientName: z.string().trim().min(2, "Enter the client name.").max(120),
  clientCompany: z.string().trim().max(120).optional(),
  clientEmail: z.string().trim().toLowerCase().pipe(z.email("Enter a valid client email.")),
  clientPhone: z.string().trim().max(40).optional(),
  clientAddress: z.string().trim().max(300).optional(),
  projectTitle: z.string().trim().min(3, "Enter a project title.").max(200),
  taxName: z.string().trim().min(1).max(30),
  taxRate: z.string().trim().min(1, "Enter a tax rate."),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the validity date.")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Enter a valid date."),
  terms: z.string().trim().min(10, "Enter the terms and conditions.").max(4000),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(quotationItemSchema).min(1, "Add at least one line item.").max(60),
});

export type QuotationInput = z.infer<typeof quotationSchema>;
