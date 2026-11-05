import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { articlePath, escapeHtml, origin, replaceContent, syncTexts } from "./site-render.mjs";
import { formatContent } from "../admin/src/content-format.js";

const content = JSON.parse(readFileSync("content/site.json", "utf8"));
const redirects = JSON.parse(readFileSync("content/redirects.json", "utf8"));
const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.equal(urls.length, new Set(urls).size, "Duplicate sitemap URLs");
assert(urls.includes(`${origin}/`), "Homepage missing from sitemap");
const titles = new Set();
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, origin);
  assert(!parsed.search && !parsed.hash && parsed.pathname !== "/index.html");
  const file = parsed.pathname === "/" ? "index.html" : parsed.pathname.slice(1);
  const html = readFileSync(`dist/${file}`, "utf8");
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
  assert(title?.trim(), `${file}: missing title`);
  assert(!titles.has(title), `${file}: duplicate title`);
  titles.add(title);
  assert(/<meta name="description" content="[^"]+"/.test(html), `${file}: missing description`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${file}: exactly one H1 required`);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1, `${file}: exactly one canonical required`);
  assert(html.includes(`rel="canonical" href="${url}"`), `${file}: canonical mismatch`);
  assert(!/noindex/i.test(html), `${file}: unexpected noindex`);
  assert(html.includes('href="articles.html"'), `${file}: articles missing from menu`);
  assert(html.includes('href="group-training.html"') && html.includes('href="personal-training.html"'), `${file}: training submenu missing`);
  assert(html.includes('Бокс для начинающих') && !html.includes('Уроки начинающим'), `${file}: old menu label`);
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const target = match[1].split(/[?#]/)[0];
    if (/^(?:https?:|mailto:|tel:|data:)/.test(target) || !target) continue;
    assert(existsSync(`dist/${target === "./" ? "index.html" : target}`), `${file}: broken link ${target}`);
  }
}
assert(!urls.includes(`${origin}/prices.html`), "Redirect stub must not be in sitemap");
const sources = new Set();
for (const redirect of redirects) {
  assert(!sources.has(redirect.from), `Duplicate redirect: ${redirect.from}`);
  sources.add(redirect.from);
  assert(redirect.from.startsWith("/") && redirect.to.startsWith("/") && !redirect.to.startsWith("//"));
  assert.notEqual(redirect.from, redirect.to, "Redirect loop");
  const target = new URL(redirect.to, origin);
  assert(urls.includes(target.origin + target.pathname), `Redirect target is not an indexable final page: ${redirect.to}`);
  assert(!redirects.some((item) => item.from === target.pathname), `Redirect chain: ${redirect.from}`);
}
for (const article of content.articles.filter((item) => item.published !== false)) {
  const html = readFileSync(`dist/${articlePath(article.slug)}`, "utf8");
  assert(html.includes(escapeHtml(article.title)) && html.includes(escapeHtml(article.text.split(/\n\n/)[0])), "Article must be readable without JavaScript");
  assert(redirects.some((item) => item.from === `/stati/${article.slug}/` && item.to === `/${articlePath(article.slug)}`), "Missing old article redirect");
}
const robot = readFileSync("robots.txt", "utf8");
assert(robot.includes(`Sitemap: ${origin}/sitemap.xml`));
assert(!/^Disallow:\s*\/\s*$/m.test(robot), "Entire website blocked");
const htaccess = readFileSync(".htaccess", "utf8");
const nginx = readFileSync("deployment/nginx-redirects.conf", "utf8");
for (const item of redirects) {
  assert(htaccess.includes(`${origin}${item.to} [R=301`));
  assert(nginx.includes(`return 301 "${origin}${item.to}";`));
}
assert(!htaccess.includes("Redirect 301 / "), "Do not redirect unknown pages to home");
// A CMS edit must reach static title/description/H1 as literal, escaped text.
const changed = structuredClone(content);
changed.pageTexts.training.text01 = 'Название "из CMS" <тест>';
changed.pageTexts.training.text02 = 'Описание "из CMS" & текст';
const html = syncTexts(readFileSync("training.html", "utf8"), changed.pageTexts);
assert(html.includes(`<title data-copy="training.text01">${escapeHtml(changed.pageTexts.training.text01)}</title>`));
assert(html.includes(`content="${escapeHtml(changed.pageTexts.training.text02)}"`));
assert.equal(replaceContent('<div data-test><div>old</div></div><p>tail</p>', 'data-test', '<p>new</p>'), '<div data-test><p>new</p></div><p>tail</p>');
changed.articles[0].text += '\n\nНовый абзац из админки.';
const saved = JSON.parse(formatContent(changed));
assert.deepEqual(saved.articles, changed.articles);
assert.deepEqual(saved.schedule, content.schedule);
assert.deepEqual(saved.photos, content.photos);
const duplicate = structuredClone(content);
duplicate.articles.push(structuredClone(duplicate.articles[0]));
assert.throws(() => formatContent(duplicate), /повторяется/, "Reject duplicate URLs before a CMS save");
console.log(`SEO проверено: ${urls.length} конечных URL, ${redirects.length} соответствий, статьи без JavaScript, CMS и экранирование текста.`);
