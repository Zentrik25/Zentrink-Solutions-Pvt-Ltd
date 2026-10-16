import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { ActionForm, TextInput } from "@/components/admin/form";
import { loginAction } from "@/app/admin/actions";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-5 py-12">
      <div className="w-full max-w-md bg-white p-8">
        <Logo className="mb-8" />
        <h1 className="mb-6 text-2xl font-extrabold uppercase text-navy-900">Administrator sign in</h1>
        <ActionForm action={loginAction} submitLabel="Sign in">
          <TextInput name="email" label="Email" type="email" required autoComplete="username" />
          <TextInput name="password" label="Password" type="password" required autoComplete="current-password" />
        </ActionForm>
      </div>
    </div>
  );
}
