import { getIndustry } from "@/lib/data";
import { OG_SIZE, renderOg } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Zentrik Solutions";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getIndustry(slug);
  return renderOg("Industry", item?.title ?? "Zentrik Solutions");
}
