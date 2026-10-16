/**
 * Upload validation: size, declared MIME type AND the real file signature
 * (magic bytes) must all agree, so a renamed executable is rejected.
 */
export type AllowedKind = "pdf" | "jpeg" | "png" | "webp" | "docx" | "xlsx";

const KINDS: Record<AllowedKind, { mime: string; ext: string[] }> = {
  pdf: { mime: "application/pdf", ext: ["pdf"] },
  jpeg: { mime: "image/jpeg", ext: ["jpg", "jpeg"] },
  png: { mime: "image/png", ext: ["png"] },
  webp: { mime: "image/webp", ext: ["webp"] },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: ["docx"],
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: ["xlsx"],
  },
};

export const ENQUIRY_DOCUMENT_KINDS: AllowedKind[] = ["pdf", "jpeg", "png", "docx", "xlsx"];
export const PUBLIC_IMAGE_KINDS: AllowedKind[] = ["jpeg", "png", "webp"];

export const LIMITS = {
  enquiryFileBytes: 3 * 1024 * 1024,
  enquiryTotalBytes: 4 * 1024 * 1024, // Vercel request bodies are capped at 4.5 MB
  enquiryMaxFiles: 3,
  imageBytes: 4 * 1024 * 1024,
} as const;

export function sniffKind(bytes: Uint8Array): AllowedKind | null {
  const s = (i: number) => bytes[i];
  if (bytes.length >= 5 && s(0) === 0x25 && s(1) === 0x50 && s(2) === 0x44 && s(3) === 0x46 && s(4) === 0x2d)
    return "pdf";
  if (bytes.length >= 3 && s(0) === 0xff && s(1) === 0xd8 && s(2) === 0xff) return "jpeg";
  if (
    bytes.length >= 8 &&
    s(0) === 0x89 && s(1) === 0x50 && s(2) === 0x4e && s(3) === 0x47 &&
    s(4) === 0x0d && s(5) === 0x0a && s(6) === 0x1a && s(7) === 0x0a
  )
    return "png";
  if (
    bytes.length >= 12 &&
    s(0) === 0x52 && s(1) === 0x49 && s(2) === 0x46 && s(3) === 0x46 &&
    s(8) === 0x57 && s(9) === 0x45 && s(10) === 0x42 && s(11) === 0x50
  )
    return "webp";
  // OOXML (docx/xlsx) are ZIP containers; distinguish by the declared extension below.
  if (bytes.length >= 4 && s(0) === 0x50 && s(1) === 0x4b && (s(2) === 0x03 || s(2) === 0x05))
    return "docx";
  return null;
}

export type ValidatedFile = {
  kind: AllowedKind;
  mime: string;
  ext: string;
  safeName: string;
};

export type FileCheck =
  | { ok: true; file: ValidatedFile }
  | { ok: false; error: string };

export function sanitiseFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.normalize("NFKD").replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-").replace(/^\.+/, "");
  return (cleaned || "file").slice(0, 100);
}

export function validateFile(
  input: { name: string; type: string; size: number; bytes: Uint8Array },
  allowed: AllowedKind[],
  maxBytes: number,
): FileCheck {
  if (input.size === 0) return { ok: false, error: `${input.name} is empty.` };
  if (input.size > maxBytes)
    return { ok: false, error: `${input.name} is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.` };

  const ext = (input.name.split(".").pop() ?? "").toLowerCase();
  let kind = sniffKind(input.bytes);
  if (kind === "docx" && ext === "xlsx") kind = "xlsx";
  if (!kind || !allowed.includes(kind))
    return { ok: false, error: `${input.name} is not an accepted file type.` };

  const def = KINDS[kind];
  if (!def.ext.includes(ext))
    return { ok: false, error: `${input.name} has an extension that does not match its content.` };
  if (input.type && input.type !== def.mime && input.type !== "application/octet-stream")
    return { ok: false, error: `${input.name} has a mismatched content type.` };

  return { ok: true, file: { kind, mime: def.mime, ext, safeName: sanitiseFilename(input.name) } };
}
