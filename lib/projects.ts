/**
 * Verified project register.
 *
 * Only projects that Zentrik Solutions has completed and confirmed should be
 * added here. The array is intentionally empty until verified case studies
 * (facts, specifications and photography) are supplied. Listing, detail
 * pages, featured sections and the sitemap all read from this array.
 */
export const PROJECT_CATEGORIES = [
  "Electrical Installations",
  "Power Distribution",
  "Solar Energy",
  "Industrial Maintenance",
  "Testing and Commissioning",
  "Procurement",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  client?: string;
  location: string;
  year: string;
  summary: string;
  description: string[];
  specifications: { label: string; value: string }[];
  services: string[];
  gallery: ProjectImage[];
};

export const PROJECTS: Project[] = [];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
