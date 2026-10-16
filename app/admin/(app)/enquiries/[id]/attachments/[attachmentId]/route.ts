import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";
import { getAttachmentForDownload } from "@/lib/enquiry/admin";
import { audit } from "@/lib/server/audit";
import { getSessionUser } from "@/lib/auth/session";
import { privateStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Private client documents: streamed only to authorised administrators, never via a public URL. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; attachmentId: string }> }) {
  const { id, attachmentId } = await ctx.params;
  try {
    const att = await getAttachmentForDownload(id, attachmentId);
    if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const obj = await privateStore().read(att.storageKey);
    if (!obj) return NextResponse.json({ error: "File unavailable" }, { status: 404 });
    const user = await getSessionUser();
    await audit(user, "enquiry.attachment_download", "EnquiryAttachment", att.id);
    return new Response(obj.body, {
      headers: {
        "Content-Type": att.mimeType,
        "Content-Disposition": `attachment; filename="${att.filename.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: e.code === "FORBIDDEN" ? 403 : 401 });
    throw e;
  }
}
