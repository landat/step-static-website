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
  for (const [section, field] of [["photos", "src"], ["news", "image"], ["videos", "src"], ["beginnerMaterials", "url"]]) {
    for (const item of content[section] ?? []) {
      if (Object.hasOwn(item, field)) item[field] = repositoryMediaPath(item[field]);
    }
  }
  return JSON.stringify(content, null, 2) + "\n";
}
