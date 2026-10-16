import { NextResponse } from "next/server";
import { AuthError, authorize } from "@/lib/auth/session";
import { loadQuotationForPdf } from "@/lib/quotation/service";
import { buildQuotationPdf } from "@/lib/quotation/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Quotation PDFs are generated on demand and only for authorised administrators. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await authorize("quotations:read");
    const { id } = await ctx.params;
    const q = await loadQuotationForPdf(id);
    if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const pdf = await buildQuotationPdf(q);
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${q.reference}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: e.code === "FORBIDDEN" ? 403 : 401 });
    throw e;
  }
}
