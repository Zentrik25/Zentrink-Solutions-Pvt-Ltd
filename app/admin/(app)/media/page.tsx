import type { Metadata } from "next";
import Image from "next/image";
import { requirePage } from "@/lib/auth/session";
import { db } from "@/lib/server/db";
import { ActionForm, TextInput } from "@/components/admin/form";
import { DeleteButton } from "@/components/admin/delete-button";
import { Panel, PageTitle } from "@/components/admin/shell";
import { deleteMediaAction, uploadMediaAction } from "../content-actions";

export const metadata: Metadata = { title: "Media" };

export default async function MediaAdmin() {
  await requirePage("media:write");
  const items = await db().media.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageTitle title="Media library" />
      <Panel title="Upload image" className="mb-8 max-w-xl">
        <ActionForm action={uploadMediaAction} submitLabel="Upload">
          <div>
            <label htmlFor="file" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-navy-900">Image (JPG, PNG or WebP, up to 4 MB)</label>
            <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="w-full text-sm" />
          </div>
          <TextInput name="alt" label="Alt text (describe the image)" maxLength={200} required />
        </ActionForm>
      </Panel>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((m) => (
          <li key={m.id} className="border border-steel-300 bg-white p-3">
            <Image src={m.url} alt={m.alt} width={m.width ?? 1600} height={m.height ?? 1067} sizes="320px" className="aspect-[4/3] w-full object-cover" />
            <p className="mt-2 break-all text-xs font-bold">{m.filename}</p>
            <p className="text-xs text-steel-500">{m.alt}</p>
            <div className="mt-3"><DeleteButton action={deleteMediaAction.bind(null, m.id)} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
