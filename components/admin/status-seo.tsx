import { Select, TextInput } from "./form";

export function StatusField({ value }: { value: string }) {
  return (
    <Select
      name="status"
      label="Status"
      defaultValue={value}
      options={[{ value: "DRAFT", label: "Draft (not visible to the public)" }, { value: "PUBLISHED", label: "Published" }]}
    />
  );
}

export function SeoFields({ title, description }: { title?: string | null; description?: string | null }) {
  return (
    <fieldset className="space-y-4 border-t border-steel-200 pt-5">
      <legend className="text-xs font-bold uppercase tracking-[0.2em] text-steel-500">SEO</legend>
      <TextInput name="seoTitle" label="SEO title" defaultValue={title} maxLength={70} hint="Up to 70 characters. Leave blank to use the page title." />
      <TextInput name="seoDescription" label="Meta description" defaultValue={description} maxLength={170} hint="Up to 170 characters." />
    </fieldset>
  );
}
