import type { Metadata } from "next";
import { requirePage } from "@/lib/auth/session";
import { listUsers } from "@/lib/auth/users";
import { ActionForm, Checkbox, Select, TextInput } from "@/components/admin/form";
import { Panel, PageTitle } from "@/components/admin/shell";
import { createUserAction, resetPasswordAction, updateUserAction } from "../content-actions";

export const metadata: Metadata = { title: "Users" };

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super admin" }, { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor (content)" }, { value: "SALES", label: "Sales (enquiries and quotations)" },
];

export default async function UsersPage() {
  const me = await requirePage("users:manage");
  const users = await listUsers();
  return (
    <>
      <PageTitle title="Administrator accounts" />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {users.map((u) => (
            <Panel key={u.id}>
              <p className="font-bold">{u.name} <span className="font-normal text-steel-500">{u.email}</span>{u.id === me.id && " (you)"}</p>
              <p className="mb-4 text-xs text-steel-500">Last sign-in: {u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 16).replace("T", " ") : "never"}</p>
              <ActionForm action={updateUserAction.bind(null, u.id)} submitLabel="Update">
                <div className="grid items-end gap-4 sm:grid-cols-2">
                  <Select name="role" label="Role" defaultValue={u.role} options={ROLES} />
                  <Checkbox name="active" label="Account active" defaultChecked={u.active} />
                </div>
              </ActionForm>
              <div className="mt-4 border-t border-steel-200 pt-4">
                <ActionForm action={resetPasswordAction.bind(null, u.id)} submitLabel="Reset password">
                  <TextInput name="password" label="New password" type="password" autoComplete="new-password" />
                </ActionForm>
              </div>
            </Panel>
          ))}
        </div>
        <Panel title="Add administrator" className="self-start">
          <ActionForm action={createUserAction} submitLabel="Create user">
            <TextInput name="name" label="Full name" required />
            <TextInput name="email" label="Email" type="email" required />
            <Select name="role" label="Role" defaultValue="EDITOR" options={ROLES} />
            <TextInput name="password" label="Temporary password" type="password" autoComplete="new-password" hint="At least 12 characters with upper case, lower case and a number." />
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
