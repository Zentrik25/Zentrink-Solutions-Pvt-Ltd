import type { Block } from "@/lib/articles";

export const lines = (v: string): string[] =>
  v.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export const paragraphs = (v: string): string[] =>
  v.split(/\r?\n\s*\r?\n/).map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim()).filter(Boolean);

export const toLines = (a: string[]): string => a.join("\n");
export const toParagraphs = (a: string[]): string => a.join("\n\n");

/** "Left | Right" per line. Lines without a separator are rejected by callers via `bad`. */
export function pairs(v: string): { pairs: [string, string][]; bad: string[] } {
  const out: [string, string][] = [];
  const bad: string[] = [];
  for (const line of lines(v)) {
    const i = line.indexOf("|");
    const a = i > 0 ? line.slice(0, i).trim() : "";
    const b = i > 0 ? line.slice(i + 1).trim() : "";
    if (a && b) out.push([a, b]);
    else bad.push(line);
  }
  return { pairs: out, bad };
}

export const pairsToText = (p: [string, string][]): string => p.map(([a, b]) => `${a} | ${b}`).join("\n");

/**
 * Article body markup: "## Heading", "- bullet" lines, blank-line separated paragraphs.
 */
export function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length) blocks.push({ type: "ul", items: list });
    list = [];
  };
  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
    } else if (line.startsWith("## ")) {
      flushList();
      flushPara();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2).trim());
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();
  return blocks;
}

export function bodyToText(blocks: Block[]): string {
  return blocks
    .map((b) => (b.type === "h2" ? `## ${b.text}` : b.type === "ul" ? b.items.map((i) => `- ${i}`).join("\n") : b.text))
    .join("\n\n");
}

export const slugify = (s: string): string =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
