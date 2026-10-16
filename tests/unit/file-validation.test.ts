import { describe, expect, it } from "vitest";
import { ENQUIRY_DOCUMENT_KINDS, LIMITS, PUBLIC_IMAGE_KINDS, sanitiseFilename, sniffKind, validateFile } from "@/lib/server/file-validation";

const bytes = (...b: number[]) => new Uint8Array([...b, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PDF = new TextEncoder().encode("%PDF-1.7 rest");
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0);
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04);
const EXE = bytes(0x4d, 0x5a, 0x90, 0x00);

const file = (name: string, type: string, b: Uint8Array) => ({ name, type, size: b.length, bytes: b });

describe("upload validation by file signature", () => {
  it("detects real types from magic bytes", () => {
    expect(sniffKind(PDF)).toBe("pdf");
    expect(sniffKind(PNG)).toBe("png");
    expect(sniffKind(JPG)).toBe("jpeg");
    expect(sniffKind(ZIP)).toBe("docx");
    expect(sniffKind(EXE)).toBeNull();
  });
  it("accepts matching documents", () => {
    expect(validateFile(file("plan.pdf", "application/pdf", PDF), ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(true);
    expect(validateFile(file("photo.jpg", "image/jpeg", JPG), ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(true);
    expect(validateFile(file("boq.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ZIP), ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(true);
  });
  it("rejects an executable renamed to .pdf", () => {
    const r = validateFile(file("virus.pdf", "application/pdf", EXE), ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes);
    expect(r.ok).toBe(false);
  });
  it("rejects extension and content mismatches", () => {
    expect(validateFile(file("image.png", "image/png", JPG), ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(false);
    expect(validateFile(file("a.pdf", "image/png", PDF), ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(false);
  });
  it("rejects disallowed kinds for public images", () => {
    expect(validateFile(file("doc.pdf", "application/pdf", PDF), PUBLIC_IMAGE_KINDS, LIMITS.imageBytes).ok).toBe(false);
    expect(validateFile(file("x.png", "image/png", PNG), PUBLIC_IMAGE_KINDS, LIMITS.imageBytes).ok).toBe(true);
  });
  it("enforces size limits and rejects empty files", () => {
    const big = { name: "big.pdf", type: "application/pdf", size: LIMITS.enquiryFileBytes + 1, bytes: PDF };
    expect(validateFile(big, ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(false);
    expect(validateFile({ name: "e.pdf", type: "application/pdf", size: 0, bytes: new Uint8Array() }, ENQUIRY_DOCUMENT_KINDS, LIMITS.enquiryFileBytes).ok).toBe(false);
  });
  it("sanitises hostile filenames", () => {
    expect(sanitiseFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitiseFilename("my plan (final).pdf")).toBe("my-plan-final.pdf");
    expect(sanitiseFilename("..hidden")).toBe("hidden");
  });
});
