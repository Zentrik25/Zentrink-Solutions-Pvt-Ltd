import type { Metadata, Viewport } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { getSeo } from "@/lib/data";
import { isIndexable } from "@/lib/seo";

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const code = Source_Code_Pro({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeo();
  return {
    metadataBase: new URL(SITE.url),
    title: { default: seo.defaultTitle, template: `%s | ${seo.titleSuffix}` },
    description: seo.defaultDescription,
    applicationName: SITE.shortName,
    openGraph: {
      type: "website",
      locale: "en_ZW",
      siteName: SITE.name,
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title: seo.defaultTitle, description: seo.defaultDescription },
    robots: isIndexable() ? { index: true, follow: true } : { index: false, follow: false },
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0d253d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${code.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
