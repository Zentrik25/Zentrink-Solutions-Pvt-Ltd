"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addProjectImage, deleteContent, removeProjectImage, saveArticle, saveCategory, saveIndustry,
  saveProject, saveService, saveSetting, type Result,
} from "@/lib/content/admin";
import { deleteMedia, uploadMedia } from "@/lib/content/media";
import { changeOwnPassword, createUser, resetUserPassword, updateUser } from "@/lib/auth/users";
import type { SettingKey } from "@/lib/content/settings";
import { guarded } from "@/lib/server/guard";
import type { FormState } from "@/components/admin/form";

const toState = (r: Result): FormState =>
  r.ok ? { ok: true, message: r.message ?? "Saved." } : { ok: false, error: r.error, fieldErrors: r.fieldErrors };

type Kind = "service" | "industry" | "project" | "article";
const savers = { service: saveService, industry: saveIndustry, project: saveProject, article: saveArticle } as const;
const paths = { service: "services", industry: "industries", project: "projects", article: "articles" } as const;

/** Create (id = "new") or update a content item. New items redirect to their edit page. */
export async function saveContentAction(kind: Kind, id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() => savers[kind](id === "new" ? null : id, fd));
  if (res.ok && id === "new" && res.id) redirect(`/admin/${paths[kind]}/${res.id}`);
  if (res.ok) revalidatePath(`/admin/${paths[kind]}`);
  return toState(res as Result);
}

export async function deleteContentAction(kind: Kind, id: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const res = await guarded(() => deleteContent(kind, id));
  if (res.ok) redirect(`/admin/${paths[kind]}`);
  return toState(res as Result);
}

export async function addProjectImageAction(projectId: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() => addProjectImage(projectId, String(fd.get("mediaId") ?? ""), String(fd.get("alt") ?? "")));
  if (res.ok) revalidatePath(`/admin/projects/${projectId}`);
  return toState(res as Result);
}

export async function removeProjectImageAction(projectId: string, imageId: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const res = await guarded(() => removeProjectImage(imageId));
  if (res.ok) revalidatePath(`/admin/projects/${projectId}`);
  return toState(res as Result);
}

export async function saveCategoryAction(_p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() => saveCategory(String(fd.get("name") ?? "")));
  if (res.ok) revalidatePath("/admin/articles");
  return toState(res as Result);
}

export async function saveSettingAction(key: SettingKey, _p: FormState, fd: FormData): Promise<FormState> {
  return toState((await guarded(() => saveSetting(key, fd))) as Result);
}

export async function uploadMediaAction(_p: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  const res = await guarded(async () =>
    uploadMedia({ name: file.name, type: file.type, size: file.size, bytes: new Uint8Array(await file.arrayBuffer()) }, String(fd.get("alt") ?? "")),
  );
  if (res.ok) revalidatePath("/admin/media");
  return res.ok ? { ok: true, message: "Image uploaded." } : toState(res as Result);
}

export async function deleteMediaAction(id: string, _p: FormState, _fd: FormData): Promise<FormState> {
  const res = await guarded(() => deleteMedia(id));
  if (res.ok) revalidatePath("/admin/media");
  return res.ok ? { ok: true, message: "Image deleted." } : toState(res as Result);
}

export async function createUserAction(_p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() =>
    createUser({ email: String(fd.get("email") ?? ""), name: String(fd.get("name") ?? ""), role: String(fd.get("role") ?? ""), password: String(fd.get("password") ?? "") }),
  );
  if (res.ok) revalidatePath("/admin/users");
  return res.ok ? { ok: true, message: "User created." } : toState(res as Result);
}

export async function updateUserAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() => updateUser(id, { role: String(fd.get("role") ?? "") || undefined, active: fd.get("active") === "on" }));
  if (res.ok) revalidatePath("/admin/users");
  return res.ok ? { ok: true, message: "User updated." } : toState(res as Result);
}

export async function resetPasswordAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() => resetUserPassword(id, String(fd.get("password") ?? "")));
  return res.ok ? { ok: true, message: "Password reset. The user has been signed out everywhere." } : toState(res as Result);
}

export async function changePasswordAction(_p: FormState, fd: FormData): Promise<FormState> {
  const res = await guarded(() => changeOwnPassword(String(fd.get("current") ?? ""), String(fd.get("next") ?? "")));
  return res.ok ? { ok: true, message: "Password changed." } : toState(res as Result);
}
