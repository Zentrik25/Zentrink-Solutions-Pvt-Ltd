import { describe, expect, it } from "vitest";
import { addProjectImage, deleteContent, removeProjectImage, saveArticle, saveCategory, saveIndustry, saveProject, saveService, saveSetting } from "@/lib/content/admin";
import { deleteMedia, uploadMedia } from "@/lib/content/media";
import { getArticle, getArticles, getContact, getIndustries, getProject, getProjects, getService, getServices } from "@/lib/data";
import { db, png, revalidated, signInAs, signOut, stores } from "../helpers/db";

const fd = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) (Array.isArray(v) ? v : [v]).forEach((x) => f.append(k, x));
  return f;
};

const service = (over: Record<string, string> = {}) =>
  fd({
    title: "Solar Energy", slug: "solar-energy", summary: "Solar PV and storage systems.", icon: "sun", status: "DRAFT", sortOrder: "1",
    overview: "Para one.\n\nPara two.", scope: "Item A\nItem B", applications: "Farms", process: "Plan | We plan\nBuild | We build", faqs: "Why? | Because.",
    ...over,
  });

describe("content publishing", () => {
  it("keeps drafts invisible to public queries and shows them once published", async () => {
    await signInAs("EDITOR");
    const saved = await saveService(null, service());
    expect(saved.ok).toBe(true);
    expect(await getServices()).toHaveLength(0);
    expect(await getService("solar-energy")).toBeUndefined();

    const id = (saved as { id: string }).id;
    expect((await saveService(id, service({ status: "PUBLISHED" }))).ok).toBe(true);
    const live = await getService("solar-energy");
    expect(live?.title).toBe("Solar Energy");
    expect(live?.process).toEqual([{ title: "Plan", text: "We plan" }, { title: "Build", text: "We build" }]);
    expect(live?.overview).toEqual(["Para one.", "Para two."]);

    // Unpublishing removes it immediately.
    await saveService(id, service({ status: "DRAFT" }));
    expect(await getService("solar-energy")).toBeUndefined();
  });

  it("revalidates the public site after every content change", async () => {
    await signInAs("ADMIN");
    await saveService(null, service({ status: "PUBLISHED" }));
    expect(revalidated).toContain("/");
  });

  it("sets publishedAt when publishing and the database rejects published rows without it", async () => {
    await signInAs("ADMIN");
    const r = await saveService(null, service({ status: "PUBLISHED" }));
    const row = await db().service.findUniqueOrThrow({ where: { id: (r as { id: string }).id } });
    expect(row.publishedAt).not.toBeNull();
    await expect(
      db().service.create({ data: { slug: "bad", title: "Bad", summary: "x".repeat(12), overview: [], scope: [], applications: [], status: "PUBLISHED" } }),
    ).rejects.toThrow();
  });

  it("validates fields and slugs", async () => {
    await signInAs("ADMIN");
    const bad = await saveService(null, service({ slug: "Not A Slug!", title: "" }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.fieldErrors ?? {})).toEqual(expect.arrayContaining(["slug", "title"]));
    const malformed = await saveService(null, service({ process: "no separator here" }));
    expect(malformed.ok).toBe(false);
    await saveService(null, service());
    const dup = await saveService(null, service());
    expect(dup).toMatchObject({ ok: false });
  });

  it("only publishers can publish: a user limited to content:write cannot", async () => {
    // SALES has content:read only, so even drafts are refused.
    await signInAs("SALES");
    await expect(saveService(null, service())).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await db().service.count()).toBe(0);
  });

  it("refuses all content operations when signed out", async () => {
    signOut();
    await expect(saveService(null, service())).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(saveArticle(null, fd({}))).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(deleteContent("service", "x")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(saveSetting("contact", fd({}))).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("links industries to services and hides unpublished services from them", async () => {
    await signInAs("ADMIN");
    await saveService(null, service({ status: "PUBLISHED" }));
    await saveService(null, service({ slug: "hidden", title: "Hidden", status: "DRAFT" }));
    const r = await saveIndustry(null, fd({
      title: "Mining", slug: "mining", summary: "Mining needs power every hour of the day.", status: "PUBLISHED", sortOrder: "0",
      needs: "n", challenges: "c", approach: "a", faqs: "Q | A", services: ["solar-energy", "hidden"],
    }));
    expect(r.ok).toBe(true);
    const [mining] = await getIndustries();
    expect(mining!.services).toEqual(["solar-energy"]);
  });

  it("publishes articles with categories, and hides drafts", async () => {
    await signInAs("EDITOR");
    const cat = await saveCategory("Solar Energy");
    expect(cat.ok).toBe(true);
    const categoryId = (cat as { id: string }).id;
    const draft = await saveArticle(null, fd({ title: "Sizing solar", slug: "sizing-solar", excerpt: "How to size a system.", categoryId, status: "DRAFT", body: "## Heading\n\nText here.\n\n- a\n- b" }));
    expect(draft.ok).toBe(true);
    expect(await getArticles()).toHaveLength(0);
    const id = (draft as { id: string }).id;
    await saveArticle(id, fd({ title: "Sizing solar", slug: "sizing-solar", excerpt: "How to size a system.", categoryId, status: "PUBLISHED", body: "## Heading\n\nText here.\n\n- a\n- b" }));
    const a = await getArticle("sizing-solar");
    expect(a?.category).toBe("Solar Energy");
    expect(a?.body.map((b) => b.type)).toEqual(["h2", "p", "ul"]);
    const empty = await saveArticle(id, fd({ title: "Sizing solar", slug: "sizing-solar", excerpt: "How to size a system.", categoryId, status: "PUBLISHED", body: "" }));
    expect(empty.ok).toBe(false);
  });

  it("requires a verified image before a project can be published", async () => {
    await signInAs("ADMIN");
    const base = { title: "Packhouse upgrade", slug: "packhouse", category: "Electrical Installations", location: "Marondera", year: "2026", summary: "Completed LV upgrade for a packhouse.", description: "Para.", specifications: "Supply | 400 V", services: [] as string[] };
    const draft = await saveProject(null, fd({ ...base, status: "DRAFT" }));
    const id = (draft as { id: string }).id;
    expect((await saveProject(id, fd({ ...base, status: "PUBLISHED" }))).ok).toBe(false);
    expect(await getProjects()).toHaveLength(0);

    const media = await uploadMedia({ name: "site.png", type: "image/png", size: 40, bytes: png(16) }, "Switchboard installed on site");
    expect(media.ok).toBe(true);
    await addProjectImage(id, (media as { id: string }).id, "Completed board");
    expect((await saveProject(id, fd({ ...base, status: "PUBLISHED" }))).ok).toBe(true);
    const p = await getProject("packhouse");
    expect(p?.gallery).toHaveLength(1);
    expect(p?.specifications).toEqual([{ label: "Supply", value: "400 V" }]);

    // The last image cannot be removed from a live project.
    const img = await db().projectImage.findFirstOrThrow();
    expect((await removeProjectImage(img.id)).ok).toBe(false);
  });

  it("homepage and contact settings are validated and editable", async () => {
    await signInAs("ADMIN");
    const bad = await saveSetting("contact", fd({ phone: "+263 78 000 0000", email: "nope", whatsappNumber: "+263", notificationEmail: "x@y.co" }));
    expect(bad.ok).toBe(false);
    const ok = await saveSetting("contact", fd({ phone: "+263 78 111 2222", email: "hello@zentriksolutions.com", whatsappNumber: "263781112222", address: "Harare", notificationEmail: "sales@zentriksolutions.com" }));
    expect(ok.ok).toBe(true);
    const c = await getContact();
    expect(c.phone).toBe("+263 78 111 2222");
    expect(c.phoneHref).toBe("tel:+263781112222");
  });
});

describe("media uploads", () => {
  it("accepts a real image into the PUBLIC store with dimensions", async () => {
    await signInAs("EDITOR");
    const r = await uploadMedia({ name: "Board Photo.png", type: "image/png", size: 40, bytes: png(16) }, "A switchboard");
    expect(r.ok).toBe(true);
    const m = await db().media.findFirstOrThrow();
    expect(m).toMatchObject({ width: 2, height: 2, mimeType: "image/png" });
    expect(stores.public.objects.has(m.key)).toBe(true);
    expect(stores.private.objects.size).toBe(0);
  });
  it("rejects PDFs, spoofed files and missing alt text", async () => {
    await signInAs("EDITOR");
    const pdfBytes = new TextEncoder().encode("%PDF-1.4 xxxx");
    expect((await uploadMedia({ name: "a.pdf", type: "application/pdf", size: pdfBytes.length, bytes: pdfBytes }, "alt")).ok).toBe(false);
    expect((await uploadMedia({ name: "evil.png", type: "image/png", size: 12, bytes: new Uint8Array([0x4d, 0x5a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) }, "alt")).ok).toBe(false);
    expect((await uploadMedia({ name: "ok.png", type: "image/png", size: 40, bytes: png(16) }, "  ")).ok).toBe(false);
    expect(await db().media.count()).toBe(0);
  });
  it("only allows media management for roles with media:write", async () => {
    await signInAs("SALES");
    await expect(uploadMedia({ name: "ok.png", type: "image/png", size: 40, bytes: png(16) }, "alt")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks deleting an image that is in use", async () => {
    await signInAs("ADMIN");
    const m = await uploadMedia({ name: "ok.png", type: "image/png", size: 40, bytes: png(16) }, "alt");
    const id = (m as { id: string }).id;
    const p = await db().project.create({ data: { slug: "p", title: "P", category: "Solar Energy", location: "x", year: "2026", summary: "s".repeat(12), description: [] } });
    await addProjectImage(p.id, id, "alt");
    expect((await deleteMedia(id)).ok).toBe(false);
    await removeProjectImage((await db().projectImage.findFirstOrThrow()).id);
    expect((await deleteMedia(id)).ok).toBe(true);
  });
});
