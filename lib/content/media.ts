import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { randomToken } from "@/lib/server/crypto";
import { authorize } from "@/lib/auth/session";
import { publicStore } from "@/lib/storage";
import { LIMITS, PUBLIC_IMAGE_KINDS, validateFile } from "@/lib/server/file-validation";
import { imageSize } from "@/lib/server/image-size";
import { revalidatePublicSite } from "./revalidate";
import type { Result } from "./admin";

export async function uploadMedia(file: { name: string; type: string; size: number; bytes: Uint8Array }, alt: string): Promise<Result> {
  const user = await authorize("media:write");
  const check = validateFile(file, PUBLIC_IMAGE_KINDS, LIMITS.imageBytes);
  if (!check.ok) return { ok: false, error: check.error };
  const altText = alt.trim().slice(0, 200);
  if (!altText) return { ok: false, error: "Add a short description (alt text) for accessibility." };

  const dims = imageSize(file.bytes);
  const key = `images/${new Date().getUTCFullYear()}/${randomToken(10)}-${check.file.safeName}`;
  let stored;
  try {
    stored = await publicStore().put(key, file.bytes, check.file.mime);
  } catch (e) {
    console.error("media upload failed", String(e));
    return { ok: false, error: "Storage is unavailable. The image was not saved." };
  }
  try {
    const media = await db().media.create({
      data: {
        key: stored.key, url: stored.url, filename: check.file.safeName, mimeType: check.file.mime, size: file.size,
        width: dims?.width ?? null, height: dims?.height ?? null, alt: altText, uploadedById: user.id,
      },
    });
    await audit(user, "media.upload", "Media", media.id, { size: file.size });
    return { ok: true, id: media.id };
  } catch (e) {
    await publicStore().remove(stored.key).catch(() => undefined);
    throw e;
  }
}

export async function deleteMedia(id: string): Promise<Result> {
  const user = await authorize("media:write");
  const m = await db().media.findUnique({
    where: { id },
    include: { _count: { select: { services: true, industries: true, articles: true, projectUses: true } } },
  });
  if (!m) return { ok: false, error: "Image not found." };
  const uses = m._count.services + m._count.industries + m._count.articles + m._count.projectUses;
  if (uses > 0) return { ok: false, error: `This image is used by ${uses} item(s). Remove it from them first.` };
  await db().media.delete({ where: { id } });
  if (!m.key.startsWith("seed/")) await publicStore().remove(m.key).catch((e) => console.error("blob delete failed", String(e)));
  await audit(user, "media.delete", "Media", id);
  revalidatePublicSite();
  return { ok: true };
}
