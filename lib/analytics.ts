/**
 * Client-side analytics helpers. Nothing here ever receives personal data:
 * events carry only coarse, non-identifying labels (event name, page path, service slug).
 */
export const GA_ID = (() => {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
  // Strict format check: the ID is interpolated into a script URL.
  return /^G-[A-Z0-9]{4,14}$/.test(id) ? id : "";
})();

export const CONSENT_KEY = "zs_analytics_consent";
export const CONSENT_EVENT = "zs:consent-changed";
export const OPEN_CONSENT_EVENT = "zs:open-consent";

export type Consent = "granted" | "denied" | null;

export function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: "granted" | "denied") {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable: choice applies to this page view only */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

export type AnalyticsEvent =
  | "generate_lead"
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "service_enquiry_click";

/** Sends an event only if the visitor consented and GA is loaded. */
export function trackEvent(name: AnalyticsEvent, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined" || !GA_ID || readConsent() !== "granted") return;
  const w = window as GtagWindow;
  if (typeof w.gtag === "function") w.gtag("event", name, params);
}

/** Maps a clicked link to a conversion event, or null. Pure, so it is unit-testable. */
export function classifyLink(href: string): { name: AnalyticsEvent; params: Record<string, string> } | null {
  if (href.startsWith("tel:")) return { name: "phone_click", params: {} };
  if (href.startsWith("mailto:")) return { name: "email_click", params: {} };
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return { name: "whatsapp_click", params: {} };
  const m = /^\/request-a-quote\?service=([a-z0-9-]{1,80})(?:&|$)/.exec(href);
  if (m) return { name: "service_enquiry_click", params: { service: m[1]! } };
  return null;
}
