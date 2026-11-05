import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { orderedNews, textCss } from "../assets/presentation.js";
import { renderStaticContent } from "./render-static-content.mjs";
import { formatContent } from "../admin/src/content-format.js";

const items = [
  { title: "old", date: "2026-01-01" },
  { title: "same-day-first", date: "2026-11-05" },
  { title: "same-day-last", date: "2026-11-05" },
  { title: "hidden", date: "2026-12-01", published: false },
];
const unchanged = structuredClone(items);
assert.deepEqual(orderedNews(items).map((n) => n.title), ["same-day-last", "same-day-first", "old"]);
assert.deepEqual(items, unchanged, "Rendering must not reorder the editor's document");
assert.equal(orderedNews([...items, { title: "pinned", date: "2020-01-01", pinned: true }])[0].title, "pinned");
assert.equal(textCss({ font: "georgia", size: "24", color: "#123abc" }), "font-family:Georgia, Times New Roman, serif;font-size:24px;color:#123abc;");
assert.equal(textCss({ font: "url(https://example.com)", size: "24;display:none", color: "red;background:url(x)" }), "");
assert.equal(textCss({ size: 1000, color: "#ffffffff" }), "");

const original = JSON.parse(readFileSync("content/site.json", "utf8"));
const changed = structuredClone(original);
changed.news.push({ ...structuredClone(changed.news[0]), date: "2099-01-01", title: "Новая новость", headingStyle: { font: "arial", size: "32", color: "#b80f0f" } });
changed.home.preparationTextStyle = { font: "verdana", size: "24", color: "#ffffff" };
changed.about.invitationStyle = { font: "georgia", size: "28", color: "#ffdd00" };
const saved = JSON.parse(formatContent(changed));
assert.deepEqual(saved, changed);
for (const key of ["photos", "schedule", "articles", "contact"]) assert.deepEqual(saved[key], original[key], `Styling must preserve ${key}`);
const rendered = renderStaticContent(readFileSync("index.html", "utf8"), saved);
assert(rendered.indexOf("Новая новость") < rendered.indexOf(original.news[0].title));
assert(rendered.includes("font-family:Arial, Helvetica, sans-serif;font-size:32px;color:#b80f0f;"));
assert(rendered.includes("font-family:Verdana, Geneva, sans-serif;font-size:24px;color:#ffffff;"));
const about = renderStaticContent(readFileSync("about.html", "utf8"), saved);
assert(about.indexOf('data-copy="about.text11"') > about.indexOf('data-copy="about.text17"'), "Invitation must follow all three cards");
assert(about.includes("font-size:28px;color:#ffdd00;"));
for (const file of readdirSync(".").filter((name) => name.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  assert(html.includes('rel="icon" href="favicon.ico"'), `${file}: favicon missing`);
  assert(html.includes('type="module" src="assets/site.js"'), `${file}: shared presentation module unavailable`);
}
const ico = readFileSync("favicon.ico");
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 2);
for (let i = 0; i < 2; i++) assert(ico.readUInt32LE(6 + i * 16 + 12) + ico.readUInt32LE(6 + i * 16 + 8) <= ico.length);
console.log("Оформление проверено: порядок новостей, стили, сохранение CMS, расположение приглашения и фавиконы.");
