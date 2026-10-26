import { Plus } from "lucide-react";

export type FaqItem = { q: string; a: string };

/** Native disclosure elements: accessible and functional without JavaScript. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.q} className="group rounded-md border border-steel-200 bg-white open:bg-steel-50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-4 text-[1.0625rem] font-normal text-navy-950 marker:content-none [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus aria-hidden className="size-4 shrink-0 text-accent-strong transition-transform group-open:rotate-45" />
          </summary>
          <p className="max-w-3xl px-5 pb-5 leading-relaxed text-steel-500">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
