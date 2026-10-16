import { revalidatePath } from "next/cache";

/** Public pages are cached; call after any publish/edit so visitors see changes immediately. */
export function revalidatePublicSite(): void {
  revalidatePath("/", "layout");
}
