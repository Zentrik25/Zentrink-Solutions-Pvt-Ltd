/**
 * End-to-end verification in a real browser against a running deployment.
 *
 *   BASE_URL=http://localhost:3100 ADMIN_EMAIL=... ADMIN_PASSWORD=... node tests/e2e/run.mjs
 *
 * Works against a local production server or a Vercel preview URL. It creates and then deletes
 * its own project and article, and leaves one test enquiry (tagged "E2E") in the inbox.
 * Set CHROMIUM_PATH if Chromium is not at /opt/pw-browsers/chromium.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
const OUT = process.env.E2E_OUT ?? "/tmp/e2e-out";
fs.mkdirSync(OUT, { recursive: true });
if (!EMAIL || !PASSWORD) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const stamp = Date.now().toString(36);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const consoleProblems = [];
ctx.on("page", (pg) => {
  pg.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !/favicon|Failed to load resource: the server responded with a status of (401|403|404)/.test(t)) consoleProblems.push(`${pg.url()} :: ${t.slice(0, 200)}`);
  });
  pg.on("pageerror", (e) => consoleProblems.push(`${pg.url()} :: pageerror ${String(e).slice(0, 200)}`));
});
const page = await ctx.newPage();

// ---------------------------------------------------------------- Workflow 1
console.log("\n# Workflow 1: visitor -> service page -> enquiry form -> database -> admin");
await page.goto(`${BASE}/services/solar-energy`);
// If analytics is configured, a consent banner is shown; decline so it cannot overlay the form.
if ((await page.locator('[role=dialog][aria-label="Analytics cookies"]').count()) > 0) await page.click('button:has-text("Decline")');
check("service page renders with one h1", (await page.locator("h1").count()) === 1);
await page.click('a:has-text("Request a Project Quote")');
await page.waitForURL(/\/request-a-quote\?service=solar-energy/);
check("CTA carries the service into the form", (await page.inputValue("#service")) === "solar-energy");
await page.focus("#name");
await page.waitForFunction(() => document.querySelector("input[name=formToken]")?.value, null, { timeout: 10000 });
await page.waitForTimeout(3300);
const who = `E2E Tester ${stamp}`;
await page.fill("#name", who);
await page.fill("#email", `e2e-${stamp}@example.com`);
await page.fill("#location", "Bulawayo");
await page.selectOption("#budget", "5k-20k");
await page.fill("#description", `Automated end-to-end test enquiry ${stamp}: hybrid solar for a small clinic.`);
await page.check("input[name=consent]");
await page.click("form button[type=submit]");
await page.waitForSelector('[role=status]:has-text("Enquiry received")', { timeout: 20000 });
const reference = (await page.locator("[role=status] strong").innerText()).trim();
check("form returns a saved reference", /^ZS-ENQ-\d{4}-\d{5}$/.test(reference), reference);
await page.screenshot({ path: `${OUT}/w1-success.png` });

const admin = await ctx.newPage();
await admin.goto(`${BASE}/admin/login`);
await admin.fill("#email", EMAIL);
await admin.fill("#password", PASSWORD);
await admin.click("button[type=submit]");
await admin.waitForURL(`${BASE}/admin`);
check("admin signs in", true);
await admin.goto(`${BASE}/admin/enquiries?q=${encodeURIComponent(reference)}`);
check("enquiry appears in admin inbox", (await admin.locator(`a:has-text("${reference}")`).count()) === 1);
await admin.click(`a:has-text("${reference}")`);
await admin.waitForSelector("text=Project description");
check("detail shows client and service", (await admin.locator(`text=${who}`).count()) > 0 && (await admin.locator("text=Solar Energy Systems").count()) > 0);
const notifications = (await admin.locator("text=Company notification").count()) + (await admin.locator("text=Client acknowledgement").count());
check("company and client notifications are recorded", notifications === 2, "delivery depends on the email provider being configured");
await admin.selectOption("select[name=status]", "UNDER_REVIEW");
await admin.click('button:has-text("Update status")');
await admin.waitForSelector("text=Status updated.");
await admin.reload();
check("status change recorded in history", (await admin.locator("text=Under Review").count()) > 1);
await admin.goto(`${BASE}/admin`);
check("dashboard lists the enquiry", (await admin.locator(`a:has-text("${reference}")`).count()) >= 1);
await admin.screenshot({ path: `${OUT}/w1-dashboard.png`, fullPage: true });

// ---------------------------------------------------------------- Workflow 4 (uses the enquiry above)
console.log("\n# Workflow 4: admin -> open enquiry -> prepare quotation -> generate PDF");
await admin.goto(`${BASE}/admin/enquiries?q=${encodeURIComponent(reference)}`);
await admin.click(`a:has-text("${reference}")`);
await admin.click('a:has-text("Create quotation")');
await admin.waitForSelector('input[name="items.0.description"]');
check("quotation form is prefilled from the enquiry", (await admin.inputValue("#clientName")) === who);
await admin.fill('input[name="items.0.description"]', "Hybrid inverter 10 kW");
await admin.fill('input[name="items.0.unitPrice"]', "2450.75");
await admin.click('button:has-text("Add item")');
await admin.fill('input[name="items.1.description"]', "Installation and commissioning");
await admin.fill('input[name="items.1.quantity"]', "2");
await admin.fill('input[name="items.1.unitPrice"]', "400.10");
const live = (await admin.locator("[aria-live=polite]").innerText()).replace(/\s+/g, " ");
check("live total uses exact decimal arithmetic", /US\$ 3,250\.95/.test(live) && /US\$ 487\.64/.test(live) && /US\$ 3,738\.59/.test(live), live.slice(0, 70));
await admin.click('button:has-text("Create quotation")');
await admin.waitForURL(/\/admin\/quotations\/[a-z0-9]+$/);
const qUrl = admin.url();
const pdf = await ctx.request.get(`${qUrl}/pdf`);
const pdfBytes = await pdf.body();
check("PDF generated for signed-in admin", pdf.status() === 200 && pdfBytes.subarray(0, 5).toString() === "%PDF-", `${pdfBytes.length} bytes`);
fs.writeFileSync(`${OUT}/quotation.pdf`, pdfBytes);
const anon = await browser.newContext();
check("PDF refused to anonymous visitors", (await anon.request.get(`${qUrl}/pdf`, { maxRedirects: 0 })).status() === 401);
await anon.close();
await admin.click('button:has-text("Send to client")');
await admin.waitForSelector("text=queued for delivery");
check("quotation send is queued with visible delivery status", true);

// ---------------------------------------------------------------- Workflow 2
console.log("\n# Workflow 2: admin -> create project -> publish -> public page -> sitemap");
const pSlug = `e2e-project-${stamp}`;
await admin.goto(`${BASE}/admin/projects/new`);
await admin.fill("input[name=title]", `E2E Project ${stamp}`);
await admin.fill("input[name=slug]", pSlug);
await admin.fill("input[name=location]", "Harare");
await admin.fill("input[name=year]", "2026");
await admin.fill("textarea[name=summary]", "End-to-end test project used to verify publishing.");
await admin.fill("textarea[name=description]", "Test description paragraph.");
await admin.fill("textarea[name=specifications]", "Supply | 400 V three phase");
await admin.click('button:has-text("Save")');
await admin.waitForURL(/\/admin\/projects\/(?!new)[a-z0-9]+$/);
const pEdit = admin.url();
check("project saved as draft", true);
check("draft project is NOT public", (await ctx.request.get(`${BASE}/projects/${pSlug}`)).status() === 404);
check("draft project is NOT in sitemap", !(await (await ctx.request.get(`${BASE}/sitemap.xml`)).text()).includes(pSlug));
await admin.selectOption("select[name=status]", "PUBLISHED");
await admin.click('button:has-text("Save")');
await admin.waitForSelector("text=at least one verified image");
check("publishing without an image is refused", true);
const firstMedia = await admin.locator("select[name=mediaId] option:not([value=''])").first().getAttribute("value");
await admin.selectOption("select[name=mediaId]", firstMedia);
await admin.fill("input[name=alt]", "Switchboard installed on site");
await admin.click('button:has-text("Add image")');
await admin.waitForSelector("text=Saved.");
await admin.reload();
await admin.selectOption("select[name=status]", "PUBLISHED");
await admin.click('button:has-text("Save")');
await admin.waitForSelector("text=Project saved.");
await page.waitForTimeout(700);
const pubRes = await ctx.request.get(`${BASE}/projects/${pSlug}`);
const pubHtml = await pubRes.text();
check("published project is public", pubRes.status() === 200 && pubHtml.includes(`E2E Project ${stamp}`));
check("project page has canonical + title", pubHtml.includes(`rel="canonical" href="https://zentriksolutions.com/projects/${pSlug}"`));
check("project is in sitemap", (await (await ctx.request.get(`${BASE}/sitemap.xml`)).text()).includes(`/projects/${pSlug}`));
// cleanup
admin.once("dialog", (d) => d.accept());
await admin.goto(pEdit);
await admin.click('button:has-text("Delete")');
await admin.waitForURL(`${BASE}/admin/projects`);
await page.waitForTimeout(500);
check("deleted project disappears from public site and sitemap", (await ctx.request.get(`${BASE}/projects/${pSlug}`)).status() === 404 && !(await (await ctx.request.get(`${BASE}/sitemap.xml`)).text()).includes(pSlug));

// ---------------------------------------------------------------- Workflow 3
console.log("\n# Workflow 3: admin -> create article -> publish -> SEO metadata -> public article");
const aSlug = `e2e-article-${stamp}`;
const seoTitle = `E2E SEO Title ${stamp}`;
const seoDesc = "A custom meta description written in the admin SEO fields for this test article.";
await admin.goto(`${BASE}/admin/articles/new`);
await admin.fill("input[name=title]", `E2E Article ${stamp}`);
await admin.fill("input[name=slug]", aSlug);
await admin.selectOption("select[name=categoryId]", { index: 1 });
await admin.fill("textarea[name=excerpt]", "An excerpt for the end-to-end test article, long enough to pass.");
await admin.fill("textarea[name=body]", "## Heading\n\nFirst paragraph of the test article.\n\n- Point one\n- Point two");
await admin.fill("input[name=seoTitle]", seoTitle);
await admin.fill("input[name=seoDescription]", seoDesc);
await admin.click('button:has-text("Save")');
await admin.waitForURL(/\/admin\/articles\/(?!new)[a-z0-9]+$/);
const aEdit = admin.url();
check("draft article is NOT public", (await ctx.request.get(`${BASE}/insights/${aSlug}`)).status() === 404);
await admin.selectOption("select[name=status]", "PUBLISHED");
await admin.click('button:has-text("Save")');
await admin.waitForSelector("text=Article saved.");
await page.waitForTimeout(700);
const aRes = await ctx.request.get(`${BASE}/insights/${aSlug}`);
const aHtml = await aRes.text();
check("published article is public", aRes.status() === 200);
check("article uses the admin SEO title", aHtml.includes(`<title>${seoTitle} | Zentrik Solutions</title>`));
check("article uses the admin meta description", aHtml.includes(`content="${seoDesc}"`));
check("article canonical + og:type=article", aHtml.includes(`href="https://zentriksolutions.com/insights/${aSlug}"`) && aHtml.includes('property="og:type" content="article"'));
const ld = [...aHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
check("Article + BreadcrumbList structured data present", ld.some((d) => d["@type"] === "Article" && d.headline.includes("E2E Article")) && ld.some((d) => d["@type"] === "BreadcrumbList"));
check("article listed on /insights and in sitemap", (await (await ctx.request.get(`${BASE}/insights`)).text()).includes(aSlug) && (await (await ctx.request.get(`${BASE}/sitemap.xml`)).text()).includes(`/insights/${aSlug}`));
admin.once("dialog", (d) => d.accept());
await admin.goto(aEdit);
await admin.click('button:has-text("Delete")');
await admin.waitForURL(`${BASE}/admin/articles`);

// ---------------------------------------------------------------- Navigation + SEO crawl
console.log("\n# Navigation, metadata and layout across every public page");
const seen = new Set();
const queue = ["/"];
const problems = [];
const titles = new Map();
while (queue.length) {
  const p = queue.shift();
  if (seen.has(p)) continue;
  seen.add(p);
  const res = await page.goto(`${BASE}${p}`);
  if (res.status() !== 200) { problems.push(`${p} -> ${res.status()}`); continue; }
  const h1 = await page.locator("h1").count();
  const title = await page.title();
  const desc = await page.locator('meta[name=description]').getAttribute("content");
  const canon = await page.locator('link[rel=canonical]').getAttribute("href");
  if (h1 !== 1) problems.push(`${p}: ${h1} h1`);
  if (title.length > 70) problems.push(`${p}: title ${title.length} chars`);
  if (!desc || desc.length < 50 || desc.length > 175) problems.push(`${p}: description length ${desc?.length}`);
  if (!canon?.startsWith("https://zentriksolutions.com")) problems.push(`${p}: canonical ${canon}`);
  if (!p.includes("?")) titles.set(title, [...(titles.get(title) ?? []), p]);
  const imgs = await page.$$eval("img", (els) => els.filter((i) => !i.alt && !i.closest("[aria-hidden]")).length);
  if (imgs) problems.push(`${p}: ${imgs} images without alt`);
  const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")));
  for (const h of hrefs) { const c = h.split("#")[0]; if (c && !c.startsWith("/_next") && !c.startsWith("/admin") && !/\.(png|ico|xml|txt)$/.test(c) && !seen.has(c)) queue.push(c); }
}
check(`all ${seen.size} reachable public URLs return 200 with 1 h1, valid title/description/canonical and image alts`, problems.length === 0, problems.slice(0, 5).join(" | "));
const dupes = [...titles.entries()].filter(([, v]) => v.length > 1);
check("every page has a unique title", dupes.length === 0, dupes.map(([t, v]) => `${t}: ${v.join(",")}`).join(" | "));

const widths = [360, 390, 768, 1440];
const paths = ["/", "/services", "/services/electrical-installations", "/industries/mining", "/projects", "/insights", "/about", "/contact", "/request-a-quote", "/privacy-policy"];
const overflow = [];
for (const w of widths) {
  const mp = await browser.newPage({ viewport: { width: w, height: 800 } });
  for (const p of paths) {
    await mp.goto(`${BASE}${p}`);
    const o = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (o) overflow.push(`${p}@${w}`);
  }
  if (w === 390) {
    await mp.goto(`${BASE}/`);
    await mp.click('button[aria-label="Open menu"]');
    const visible = await mp.locator("#mobile-nav").isVisible();
    const links = await mp.locator("#mobile-nav a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    check("mobile menu opens with all primary links", visible && ["/services", "/about", "/projects", "/industries", "/insights", "/contact", "/request-a-quote"].every((l) => links.includes(l)));
    await mp.click('#mobile-nav a[href="/services"]');
    await mp.waitForURL(`${BASE}/services`);
    check("mobile menu navigates and closes", (await mp.locator("#mobile-nav").count()) === 0);
    await mp.goto(`${BASE}/`);
    await mp.screenshot({ path: `${OUT}/mobile-home.png` });
  }
  await mp.close();
}
check("no horizontal overflow at 360, 390, 768 and 1440 px on key pages", overflow.length === 0, overflow.join(", "));
await page.goto(`${BASE}/`);
await page.screenshot({ path: `${OUT}/desktop-home.png`, fullPage: true });

const csp = consoleProblems.filter((c) => /Content Security Policy|Refused to/i.test(c));
check("no Content-Security-Policy violations in the browser", csp.length === 0, csp.slice(0, 3).join(" | "));
check("no unexpected browser console errors", consoleProblems.length === 0, consoleProblems.slice(0, 3).join(" | "));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
