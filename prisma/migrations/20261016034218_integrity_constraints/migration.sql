-- Database-level integrity rules that Prisma cannot express in the schema.

ALTER TABLE "AdminUser"
  ADD CONSTRAINT "AdminUser_email_lowercase_chk" CHECK ("email" = lower("email"));

ALTER TABLE "Enquiry"
  ADD CONSTRAINT "Enquiry_consent_chk" CHECK ("consentGiven" = true);

ALTER TABLE "Quotation"
  ADD CONSTRAINT "Quotation_currency_chk" CHECK ("currency" = 'USD'),
  ADD CONSTRAINT "Quotation_taxRate_chk" CHECK ("taxRate" >= 0 AND "taxRate" <= 100),
  ADD CONSTRAINT "Quotation_amounts_chk" CHECK ("subtotal" >= 0 AND "taxAmount" >= 0 AND "total" >= 0);

ALTER TABLE "QuotationItem"
  ADD CONSTRAINT "QuotationItem_position_chk" CHECK ("position" >= 1),
  ADD CONSTRAINT "QuotationItem_quantity_chk" CHECK ("quantity" > 0),
  ADD CONSTRAINT "QuotationItem_prices_chk" CHECK ("unitPrice" >= 0 AND "lineTotal" >= 0);

-- Published content must carry a publication timestamp.
ALTER TABLE "Service"  ADD CONSTRAINT "Service_published_chk"  CHECK ("status" = 'DRAFT' OR "publishedAt" IS NOT NULL);
ALTER TABLE "Industry" ADD CONSTRAINT "Industry_published_chk" CHECK ("status" = 'DRAFT' OR "publishedAt" IS NOT NULL);
ALTER TABLE "Project"  ADD CONSTRAINT "Project_published_chk"  CHECK ("status" = 'DRAFT' OR "publishedAt" IS NOT NULL);
ALTER TABLE "Article"  ADD CONSTRAINT "Article_published_chk"  CHECK ("status" = 'DRAFT' OR "publishedAt" IS NOT NULL);

-- URL-safe slugs only.
ALTER TABLE "Service"         ADD CONSTRAINT "Service_slug_chk"         CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Industry"        ADD CONSTRAINT "Industry_slug_chk"        CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Project"         ADD CONSTRAINT "Project_slug_chk"         CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Article"         ADD CONSTRAINT "Article_slug_chk"         CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_slug_chk" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
