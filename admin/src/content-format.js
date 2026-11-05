// Sveltia can return the global public URL even from a field-level media picker.
// Keep the existing repository-relative contract used by the site and its validator.
export function repositoryMediaPath(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/^\/step-static-website\/(?=assets\/(?:photos|videos|materials)\/)/, "")
    .replace(/^\.\/(?=assets\/(?:photos|videos|materials)\/)/, "")
    .replace(/^\/(?=assets\/(?:photos|videos|materials)\/)/, "");
}

export function formatContent(value) {
  const content = structuredClone(value);
  const articleSlugs = new Set();
  for (const article of content.articles || []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || "")) throw new Error("Укажите адрес статьи: строчные латинские буквы, цифры и дефисы.");
    if (articleSlugs.has(article.slug)) throw new Error(`Адрес статьи «${article.slug}» повторяется. Для каждой статьи нужен свой адрес.`);
    articleSlugs.add(article.slug);
  }
  for (const [section, field] of [["about", "image"], ["home", "heroImage"], ["home", "directionsImage"]]) {
    if (content[section] && Object.hasOwn(content[section], field)) {
      content[section][field] = repositoryMediaPath(content[section][field]);
    }
  }
  for (const [section, field] of [["photos", "src"], ["news", "image"], ["videos", "src"], ["beginnerMaterials", "url"]]) {
    for (const item of content[section] ?? []) {
      if (Object.hasOwn(item, field)) item[field] = repositoryMediaPath(item[field]);
    }
  }
  return JSON.stringify(content, null, 2) + "\n";
}
