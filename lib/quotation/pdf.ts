import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatMoney } from "./math";
import { LOGO_ASPECT, LOGO_PNG_BASE64 } from "./logo-data";

export type PdfQuotation = {
  reference: string;
  createdAt: Date;
  validUntil: Date;
  status: string;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string;
  clientPhone: string | null;
  clientAddress: string | null;
  projectTitle: string;
  taxName: string;
  taxRate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  terms: string;
  notes: string | null;
  items: { description: string; quantity: string; unitPrice: string; lineTotal: string }[];
  company: { phone: string; email: string; address: string };
};

const NAVY = rgb(0.043, 0.122, 0.227);
const ORANGE = rgb(0.949, 0.416, 0.106);
const GREY = rgb(0.31, 0.357, 0.412);
const LINE = rgb(0.788, 0.816, 0.847);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 48;

/** Standard PDF fonts only encode WinAnsi; replace anything else rather than crash. */
function clean(text: string): string {
  return text
    .replace(/[\r\t]/g, " ")
    .replace(/[^\n\x20-\x7e -ÿ–—‘’“”•€]/g, "?");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of clean(text).split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
      else {
        if (line) out.push(line);
        line = word;
        while (font.widthOfTextAtSize(line, size) > maxWidth && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > maxWidth) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      }
    }
    out.push(line);
  }
  return out;
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function buildQuotationPdf(q: PdfQuotation): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Quotation ${q.reference}`);
  pdf.setAuthor("Zentrik Solutions (Pvt) Ltd");
  pdf.setProducer("Zentrik Solutions");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64"));

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - M;

  const text = (s: string, x: number, size = 10, font = regular, color = rgb(0.12, 0.14, 0.17)) =>
    page.drawText(clean(s), { x, y, size, font, color });
  const rightText = (s: string, xRight: number, size = 10, font = regular) => {
    const c = clean(s);
    page.drawText(c, { x: xRight - font.widthOfTextAtSize(c, size), y, size, font, color: rgb(0.12, 0.14, 0.17) });
  };
  const rule = (yy: number, color = LINE, thickness = 0.75) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: PAGE_W - M, y: yy }, thickness, color });

  const header = () => {
    const logoW = 190;
    page.drawImage(logo, { x: M, y: y - logoW / LOGO_ASPECT + 8, width: logoW, height: logoW / LOGO_ASPECT });
    const top = y;
    y = top;
    rightText("QUOTATION", PAGE_W - M, 20, bold);
    y -= 16;
    rightText(q.reference, PAGE_W - M, 11, bold);
    y = top - logoW / LOGO_ASPECT - 14;
    page.drawRectangle({ x: M, y: y, width: PAGE_W - 2 * M, height: 3, color: ORANGE });
    y -= 22;
  };
  header();

  // Company + client columns
  const colTop = y;
  text("FROM", M, 8, bold, GREY);
  y -= 13;
  text("Zentrik Solutions (Pvt) Ltd", M, 10, bold);
  for (const line of [q.company.address, `Tel: ${q.company.phone}`, q.company.email].filter(Boolean)) {
    y -= 12;
    for (const l of wrap(line, regular, 9, 230)) {
      text(l, M, 9);
      y -= 11;
    }
    y += 11;
  }
  const leftBottom = y;
  y = colTop;
  const cx = PAGE_W / 2 + 10;
  text("PREPARED FOR", cx, 8, bold, GREY);
  y -= 13;
  text(q.clientName, cx, 10, bold);
  for (const line of [q.clientCompany, q.clientAddress, q.clientEmail, q.clientPhone].filter(Boolean) as string[]) {
    y -= 12;
    for (const l of wrap(line, regular, 9, 230)) {
      text(l, cx, 9);
      y -= 11;
    }
    y += 11;
  }
  y = Math.min(y, leftBottom) - 24;

  // Meta row
  rule(y + 8);
  const metaY = y - 6;
  y = metaY;
  const meta: [string, string][] = [
    ["PROJECT", q.projectTitle],
    ["DATE", fmtDate(q.createdAt)],
    ["VALID UNTIL", fmtDate(q.validUntil)],
  ];
  const mx = [M, M + 250, M + 380];
  meta.forEach(([k, v], i) => {
    page.drawText(k, { x: mx[i]!, y, size: 8, font: bold, color: GREY });
    const lines = wrap(v, regular, 10, i === 0 ? 235 : 120);
    lines.slice(0, 2).forEach((l, j) =>
      page.drawText(l, { x: mx[i]!, y: y - 13 - j * 12, size: 10, font: i === 0 ? bold : regular, color: rgb(0.12, 0.14, 0.17) }),
    );
  });
  y -= 44;

  // Items table
  const colQty = PAGE_W - M - 190;
  const colUnit = PAGE_W - M - 110;
  const colTotal = PAGE_W - M;
  const tableHeader = () => {
    page.drawRectangle({ x: M, y: y - 6, width: PAGE_W - 2 * M, height: 22, color: NAVY });
    page.drawText("DESCRIPTION", { x: M + 8, y: y + 1, size: 8, font: bold, color: rgb(1, 1, 1) });
    for (const [label, xr] of [["QTY", colQty], ["UNIT PRICE", colUnit], ["AMOUNT", colTotal - 8]] as const) {
      page.drawText(label, { x: xr - bold.widthOfTextAtSize(label, 8), y: y + 1, size: 8, font: bold, color: rgb(1, 1, 1) });
    }
    y -= 26;
  };
  tableHeader();

  q.items.forEach((item, i) => {
    const lines = wrap(item.description, regular, 10, colQty - M - 80);
    const h = Math.max(1, lines.length) * 13 + 10;
    if (y - h < M + 150) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - M;
      tableHeader();
    }
    page.drawText(String(i + 1), { x: M + 8, y, size: 9, font: regular, color: GREY });
    lines.forEach((l, j) => page.drawText(l, { x: M + 24, y: y - j * 13, size: 10, font: regular, color: rgb(0.12, 0.14, 0.17) }));
    const qty = String(Number(item.quantity));
    rightText(qty, colQty, 10);
    rightText(formatMoney(item.unitPrice), colUnit, 10);
    rightText(formatMoney(item.lineTotal), colTotal - 8, 10);
    y -= h - 2;
    rule(y + 4);
    y -= 8;
  });

  // Totals
  if (y < M + 130) {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - M;
  }
  y -= 8;
  const tl = PAGE_W - M - 230;
  const totalsRow = (label: string, value: string, strong = false) => {
    page.drawText(label, { x: tl, y, size: strong ? 11 : 10, font: strong ? bold : regular, color: rgb(0.12, 0.14, 0.17) });
    rightText(value, colTotal - 8, strong ? 11 : 10, strong ? bold : regular);
    y -= 18;
  };
  totalsRow("Subtotal", formatMoney(q.subtotal));
  totalsRow(`${q.taxName} (${Number(q.taxRate)}%)`, formatMoney(q.taxAmount));
  y -= 10;
  page.drawRectangle({ x: tl - 8, y: y - 6, width: colTotal - tl + 8, height: 24, color: NAVY });
  page.drawText("TOTAL (USD)", { x: tl, y: y + 1, size: 10, font: bold, color: rgb(1, 1, 1) });
  const totalStr = formatMoney(q.total);
  page.drawText(totalStr, { x: colTotal - 8 - bold.widthOfTextAtSize(totalStr, 11), y: y + 1, size: 11, font: bold, color: rgb(1, 1, 1) });
  y -= 40;

  // Notes + terms
  const block = (title: string, body: string) => {
    const lines = wrap(body, regular, 9, PAGE_W - 2 * M);
    if (y - 20 - lines.length * 12 < M + 20) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - M;
    }
    page.drawText(title, { x: M, y, size: 8, font: bold, color: GREY });
    y -= 14;
    for (const l of lines) {
      if (y < M + 20) {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - M;
      }
      page.drawText(l, { x: M, y, size: 9, font: regular, color: rgb(0.12, 0.14, 0.17) });
      y -= 12;
    }
    y -= 10;
  };
  if (q.notes) block("NOTES", q.notes);
  block("TERMS AND CONDITIONS", q.terms);

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(`${q.reference}  |  Page ${i + 1} of ${pages.length}`, { x: M, y: 24, size: 8, font: regular, color: GREY });
  });
  return pdf.save();
}
