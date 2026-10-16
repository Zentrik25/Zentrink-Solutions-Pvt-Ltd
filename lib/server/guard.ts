import { AuthError } from "@/lib/auth/session";

type R = { ok: boolean; error?: string; fieldErrors?: Record<string, string>; message?: string; id?: string };

/** Turns authorisation failures into friendly form errors for Server Actions. */
export async function guarded<T extends R>(fn: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError)
      return { ok: false, error: e.code === "FORBIDDEN" ? "You do not have permission to do that." : "Your session has expired. Sign in again." };
    throw e;
  }
}
