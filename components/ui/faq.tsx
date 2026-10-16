import { Plus } from "lucide-react";

export type FaqItem = { q: string; a: string };

/** Native disclosure elements: accessible and functional without JavaScript. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-steel-300">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-steel-300">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-bold text-navy-900 marker:content-none [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus
              aria-hidden
              className="size-5 shrink-0 text-accent-strong transition-transform group-open:rotate-45"
            />
          </summary>
          <p className="max-w-3xl pb-6 leading-relaxed text-steel-600">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
