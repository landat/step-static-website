import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { articlePage, articlePath, escapeHtml, origin, paragraphs, renderArticleList, replaceContent, syncTexts } from "./site-render.mjs";
import { renderStaticContent } from "./render-static-content.mjs";

// Dist is a publication directory, never a source of CMS data.
const content = JSON.parse(await readFile("content/site.json", "utf8"));
const texts = content.pageTexts;
const outputPath = resolve("dist");
if (dirname(outputPath) !== process.cwd()) throw new Error("Output must be the workspace's dist directory");
await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
for (const folder of ["assets", "admin", "content"]) await cp(folder, `dist/${folder}`, { recursive: true });
await cp(".nojekyll", "dist/.nojekyll");
await cp("favicon.ico", "dist/favicon.ico");

const files = (await readdir(".")).filter((name) => name.endsWith(".html") && !name.startsWith("article-"));
const pages = new Map();
for (const name of files) {
  let html = syncTexts(await readFile(name, "utf8"), texts);
  html = replaceContent(html, "data-about-title", escapeHtml(content.about.title));
  html = replaceContent(html, "data-about-text", paragraphs(content.about.text));
  const groups = content.schedule.groups.map((group) => `<article class="card"><h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.description)}</p></article>`).join("\n");
  html = replaceContent(html, "data-schedule-groups", groups);
  html = replaceContent(html, "data-schedule-intro", escapeHtml(content.schedule.intro));
  html = replaceContent(html, "data-schedule-address", escapeHtml(content.contact.address));
  html = replaceContent(html, "data-contact-address", escapeHtml(content.contact.address));
  html = replaceContent(html, "data-contact-directions", paragraphs(content.contact.directions));
  html = replaceContent(html, "data-articles-list", renderArticleList(content.articles, texts.articles));
  for (const [attr, value] of [["data-prices-intro", content.prices.intro], ["data-prices-explanation-title", content.prices.explanationTitle], ["data-prices-explanation", content.prices.explanation]]) html = replaceContent(html, attr, attr === "data-prices-explanation" ? paragraphs(value) : escapeHtml(value));
  html = replaceContent(html, "data-price-items", content.prices.items.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join("\n"));
  html = renderStaticContent(html, content);
  pages.set(name, html);
}
const shell = pages.get("articles.html");
for (const article of content.articles.filter((item) => item.published !== false)) pages.set(articlePath(article.slug), articlePage(shell, article, texts.articles));
for (const [file, html] of pages) await writeFile(`dist/${file}`, html);

// A sitemap contains only final, indexable URLs, with no duplicates or redirect stubs.
const redirects = JSON.parse(await readFile("content/redirects.json", "utf8"));
const redirectFiles = new Set(redirects.filter((item) => /^\/[^/]+\.html$/.test(item.from)).map((item) => item.from.slice(1)));
const urls = [...pages.keys()].filter((file) => file === "index.html" || !redirectFiles.has(file)).map((file) => `${origin}/${file === "index.html" ? "" : file}`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile("sitemap.xml", sitemap);
await writeFile("dist/sitemap.xml", sitemap);
await cp("robots.txt", "dist/robots.txt");
await cp(".htaccess", "dist/.htaccess");
console.log(`Сборка сайта: ${pages.size} HTML-страниц, ${urls.length} адресов в sitemap.xml. Каталог публикации: dist/.`);
