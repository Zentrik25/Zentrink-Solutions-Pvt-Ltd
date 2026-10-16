"use client";

import { GA_ID, OPEN_CONSENT_EVENT } from "@/lib/analytics";

/** Footer control to change the analytics choice. Rendered only when analytics is configured. */
export function CookieSettings({ className }: { className?: string }) {
  if (!GA_ID) return null;
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Cookie settings
    </button>
  );
}
