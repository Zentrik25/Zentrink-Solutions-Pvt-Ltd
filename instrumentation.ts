import type { Instrumentation } from "next";

/**
 * Called by Next.js for every unhandled server error (pages, actions, route handlers).
 * Writes one structured, redacted JSON line that Vercel Logs and any log drain
 * (Datadog, Better Stack, Sentry via drain, ...) can alert on.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { log } = await import("@/lib/server/log");
  // Query strings are dropped: they can contain search terms or tokens.
  const path = request.path.split("?")[0];
  log(
    "error",
    "request.unhandled_error",
    { method: request.method, path, routePath: context.routePath, routeType: context.routeType, renderSource: context.renderSource },
    err,
  );
};
