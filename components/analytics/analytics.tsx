"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CONSENT_EVENT,
  GA_ID,
  OPEN_CONSENT_EVENT,
  classifyLink,
  readConsent,
  trackEvent,
  writeConsent,
  type Consent,
} from "@/lib/analytics";

/**
 * Loads Google Analytics 4 ONLY after the visitor accepts. Until then no Google
 * script is requested and no analytics cookies are set. If no measurement ID is
 * configured, this component renders nothing.
 */
function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

export function Analytics() {
  // Server render and hydration see "unknown", so no banner or script is ever emitted server-side.
  const consent = useSyncExternalStore<Consent | "unknown">(subscribe, readConsent, () => "unknown");
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const onOpen = () => setReopened(true);
    const onChange = () => setReopened(false);
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
      window.removeEventListener(CONSENT_EVENT, onChange);
    };
  }, []);

  const open = consent === null || reopened;

  // Conversion events for phone, email, WhatsApp and service-enquiry links (no personal data).
  useEffect(() => {
    if (consent !== "granted") return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const hit = classifyLink(a.getAttribute("href") ?? "");
      if (hit) trackEvent(hit.name, { ...hit.params, page_path: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [consent]);

  if (!GA_ID || consent === "unknown") return null;

  return (
    <>
      {consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());
gtag('config','${GA_ID}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
          </Script>
        </>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="Analytics cookies"
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-white/10 bg-navy-950 shadow-deep p-5 text-white"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-sm leading-relaxed text-steel-300">
              We would like to use Google Analytics cookies to understand how the website is used and
              to improve it. No analytics are loaded unless you accept, and we never send the details
              you enter in enquiry forms.{" "}
              <a href="/privacy-policy" className="font-semibold text-white underline">
                Privacy Policy
              </a>
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={() => writeConsent("denied")}
                className="rounded-sm border border-white/30 px-5 py-2.5 text-sm hover:bg-white/10"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => writeConsent("granted")}
                className="rounded-sm bg-accent px-5 py-2.5 text-sm text-navy-950 hover:bg-[#e8590c]"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
