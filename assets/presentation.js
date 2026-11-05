// Shared with the static builder: the editor stores choices, never arbitrary CSS.
export const fonts = {
  site: "Montserrat, Segoe UI, Arial, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  georgia: "Georgia, Times New Roman, serif",
  verdana: "Verdana, Geneva, sans-serif",
  system: "system-ui, sans-serif",
};

export function textCss(style) {
  if (!style || typeof style !== "object") return "";
  const rules = [];
  if (Object.hasOwn(fonts, style.font)) rules.push(`font-family:${fonts[style.font]}`);
  const size = Number(style.size);
  if (Number.isFinite(size) && size >= 14 && size <= 56) rules.push(`font-size:${size}px`);
  if (/^#[a-f0-9]{6}$/i.test(style.color || "")) rules.push(`color:${style.color}`);
  return rules.length ? rules.join(";") + ";" : "";
}

export function orderedNews(source) {
  return (Array.isArray(source) ? source : []).map((item, index) => ({ item, index }))
    .filter(({ item }) => item && item.published !== false)
    .sort((a, b) => Number(Boolean(b.item.pinned)) - Number(Boolean(a.item.pinned)) || String(b.item.date || "").localeCompare(String(a.item.date || "")) || b.index - a.index)
    .map(({ item }) => item);
}
