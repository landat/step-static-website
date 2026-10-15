import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { formatContent } from "../admin/src/content-format.js";

const content = JSON.parse(readFileSync("content/site.json", "utf8"));
const lookup = (key) => key.split(".").reduce((value, part) => value?.[part], content.pageTexts);
const references = new Set();
const dynamic = /\bdata-(?:announcement|news-list|carousel-track|carousel-status|video-catalog|beginner-materials|about-title|about-text|about-photo|prices-intro|price-items|prices-explanation-title|prices-explanation|prices-button|schedule-intro|schedule-groups|schedule-head|schedule-table|schedule-address|contact-address|contact-phone|contact-email|contact-directions)(?=[\s=>])/;
for (const file of readdirSync(".").filter((file) => file.endsWith(".html"))) {
  const source = readFileSync(file, "utf8");
  assert(!source.includes("Овсиенко"), `${file}: incorrect street spelling`);
  for (const match of source.matchAll(/data-copy(?:-(?:alt|aria-label|title|content))?="([^"]+)"/g)) {
    assert.equal(typeof lookup(match[1]), "string", `${file}: missing text ${match[1]}`);
    references.add(match[1]);
  }
  const stack = [];
  for (const token of source.match(/<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith("</")) {
      const tag = token.match(/^<\/([\w-]+)/)?.[1];
      const index = stack.findLastIndex((item) => item.tag === tag);
      if (index >= 0) stack.length = index;
    } else if (token.startsWith("<")) {
      const tag = token.match(/^<([\w-]+)/)?.[1];
      if (!tag || ["meta", "link", "img", "br", "hr", "input", "source", "wbr"].includes(tag)) continue;
      stack.push({ tag, editable: stack.at(-1)?.editable || /\bdata-copy=/.test(token),
        excluded: stack.at(-1)?.excluded || ["script", "style", "noscript"].includes(tag) || dynamic.test(token) || /class="top-phone"|aria-hidden="true"/.test(token) });
    } else if (/[a-zа-яё0-9]/i.test(token) && !stack.at(-1)?.excluded) {
      assert(stack.at(-1)?.editable, `${file}: text outside CMS: ${token.trim()}`);
    }
  }
}
assert(references.size >= 136, "Every static page must expose its text fields");
assert(content.contact.address.includes("Антонова-Овсеенко"));
const code = readFileSync("assets/site.js", "utf8");
for (const match of code.matchAll(/copyText\("([^"]+)"/g)) assert.equal(typeof lookup(match[1]), "string", match[1]);
// Empty values, old JSON documents and literal HTML must not break text rendering.
const helper = code.slice(0, code.indexOf("function renderPageTexts"));
const context = {};
runInNewContext(helper + `
  pageTextValues = { home: { title: '<img src=x onerror=alert(1)>', blank: '', cleared: null } };
  result = [copyText('home.title'), copyText('home.blank', 'old'), copyText('home.cleared', 'old'), copyText('missing.field', 'fallback')];
`, context);
assert.equal(context.result[0], "<img src=x onerror=alert(1)>");
assert.equal(context.result[1], "");
assert.equal(context.result[2], "");
assert.equal(context.result[3], "fallback");
const edited = structuredClone(content);
edited.pageTexts.training.text04 = "Новый заголовок";
edited.pageTexts.home.text05 = "Первый абзац.\nВторой абзац.";
assert.deepEqual(JSON.parse(formatContent(edited)), edited, "Text edits must preserve all other content");
console.log(`Тексты проверены: ${references.size} привязок, адрес, пустые значения и сохранение остальных разделов.`);
