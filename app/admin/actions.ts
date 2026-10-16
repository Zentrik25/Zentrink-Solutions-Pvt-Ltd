"use server";

import { redirect } from "next/navigation";
import { attemptLogin } from "@/lib/auth/login";
import { createSession, destroySession } from "@/lib/auth/session";
import { clientIp, userAgent } from "@/lib/server/request";
import type { FormState } from "@/components/admin/form";

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  const result = await attemptLogin(email, password, await clientIp());
  if (!result.ok) return { ok: false, error: result.error };
  await createSession(result.userId, await userAgent());
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
