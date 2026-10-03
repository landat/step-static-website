import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import Ajv from "ajv";
import { parse } from "yaml";
import { formatContent, repositoryMediaPath } from "../admin/src/content-format.js";

const config = parse(readFileSync("admin/config.yml", "utf8"));
const legacy = parse(readFileSync(".pages.yml", "utf8"));
const content = JSON.parse(readFileSync("content/site.json", "utf8"));
const schema = JSON.parse(readFileSync("node_modules/@sveltia/cms/schema/sveltia-cms.json", "utf8"));
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
const validate = ajv.compile(schema);
assert(validate(config), JSON.stringify(validate.errors, null, 2));
assert.deepEqual(config.backend.auth_methods, ["token"]);
assert.equal(config.backend.repo, "landat/step-static-website");
assert.equal(config.backend.branch, "main");
const files = config.collections.flatMap((collection) => collection.files);
assert.equal(files.length, 1, "The shared JSON must have one complete editor");
assert.equal(files[0].file, "content/site.json");

function check(oldFields, newFields, data, prefix = "") {
  assert.deepEqual(newFields.map((field) => field.name), oldFields.map((field) => field.name), prefix);
  for (const old of oldFields) {
    const field = newFields.find((item) => item.name === old.name);
    const path = `${prefix}${old.name}`;
    assert.equal(field.required, old.required ?? (old.type === "object" && !old.list), `${path}: required`);
    assert.deepEqual(field.default, old.default, `${path}: default`);
    if (old.options?.maxlength) assert.equal(field.maxlength, old.options.maxlength, path);
    if (old.pattern) assert.deepEqual(field.pattern, [old.pattern.regex, old.pattern.message], path);
    if (old.type === "select") assert.deepEqual(field.options.map((item) => item.value), old.options.values.map((item) => item.name), path);
    if (old.type === "date") assert.equal(field.format, "YYYY-MM-DD", path);
    if (old.list) assert.equal(field.min, old.list.min ?? 0, path);
    if (old.options?.media) {
      const media = legacy.media.find((item) => item.name === old.options.media);
      assert.equal(field.media_folder, `/${media.input}`, path);
      assert.equal(field.public_folder, `./${media.output}`, path);
      assert.equal(field.accept, media.extensions.map((ext) => `.${ext}`).join(","), path);
      const url = new URL(`${field.public_folder}/test.jpg`, config.site_url);
      assert(url.pathname.startsWith("/step-static-website/assets/"), `${path}: project subpath lost`);
    }
    if (old.fields) {
      const values = old.list ? (data?.[old.name] ?? [{}]) : [data?.[old.name] ?? {}];
      // Check schema even for currently empty lists.
      for (const value of values.length ? values : [{}]) check(old.fields, field.fields, value, `${path}.`);
    }
  }
  for (const key of Object.keys(data ?? {})) assert(newFields.some((field) => field.name === key), `${prefix}${key}: existing content has no field`);
}

check(legacy.content.flatMap((section) => section.fields), files[0].fields, content);
for (const filename of ["admin/index.html", "admin/help.html", "admin/vendor/cms.js", "admin/vendor/SVELTIA-LICENSE.txt"]) assert(existsSync(filename), filename);
assert(!/<script[^>]+src=["']https?:/i.test(readFileSync("admin/index.html", "utf8")), "CMS must be served locally");
assert.deepEqual(JSON.parse(formatContent(content)), content, "Existing content must survive serialization");
const changed = structuredClone(content);
changed.photos[0].src = "/step-static-website/assets/photos/club-02.jpg";
changed.news[0].image = "./assets/photos/club-02.jpg";
changed.videos[0].src = "/assets/videos/hand-wrapping-lesson.mp4";
changed.beginnerMaterials[0].url = "/step-static-website/assets/materials/guide.pdf";
const roundTrip = JSON.parse(formatContent(changed));
assert.equal(roundTrip.photos[0].src, "assets/photos/club-02.jpg");
assert.equal(roundTrip.news[0].image, "assets/photos/club-02.jpg");
assert.equal(roundTrip.videos[0].src, "assets/videos/hand-wrapping-lesson.mp4");
assert.equal(roundTrip.beginnerMaterials[0].url, "assets/materials/guide.pdf");
assert.equal(changed.photos[0].src, "/step-static-website/assets/photos/club-02.jpg", "Do not mutate editor data");
assert.equal(repositoryMediaPath("https://example.com/assets/photos/photo.jpg"), "https://example.com/assets/photos/photo.jpg");
assert.equal(repositoryMediaPath("photos.html"), "photos.html");
console.log("Проверка CMS пройдена: схема Sveltia, все поля Pages CMS, медиа и пути GitHub Pages.");
