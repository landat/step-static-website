// Shared, deterministic HTML rendering for the static publication build.
export const origin = "https://meteorboxing.ru";
export const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
export const lookup = (values, key) => key.split(".").reduce((value, part) => value?.[part], values);
export const paragraphs = (value = "") => String(value).split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean).map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`).join("\n");
export const articlePath = (slug) => `article-${slug}.html`;

export function syncTexts(html, values) {
  html = html.replace(/(<([\w-]+)\b[^>]*\bdata-copy="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g, (all, opening, tag, key, closing) => {
    const value = lookup(values, key);
    return value === undefined ? all : opening + escapeHtml(value ?? "") + closing;
  });
  return html.replace(/<[\w-]+\b[^>]*>/g, (tag) => {
    for (const attribute of ["alt", "aria-label", "title", "content"]) {
      const key = tag.match(new RegExp(`\\bdata-copy-${attribute}="([^"]+)"`))?.[1];
      const value = key && lookup(values, key);
      if (value !== undefined && key) tag = tag.replace(new RegExp(`(?<![\\w-])${attribute}="[^"]*"`), `${attribute}="${escapeHtml(value ?? "")}"`);
    }
    return tag;
  });
}

// Find the matching closing tag, including nested elements with the same name.
export function replaceContent(html, attribute, body) {
  const opening = new RegExp(`<([\\w-]+)\\b[^>]*\\b${attribute}(?=[\\s=>])[^>]*>`).exec(html);
  if (!opening) return html;
  const tag = opening[1];
  const start = opening.index + opening[0].length;
  const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, "g");
  tokens.lastIndex = start;
  let depth = 1;
  for (let match; (match = tokens.exec(html));) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (!depth) return html.slice(0, start) + body + html.slice(match.index);
  }
  throw new Error(`Unclosed element: ${attribute}`);
}

export function renderArticleList(articles, texts) {
  return articles.filter((item) => item.published !== false).map((item) => `<article class="card article-card"><h2><a href="${articlePath(item.slug)}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.description)}</p><a href="${articlePath(item.slug)}">${escapeHtml(texts.readMore)}</a></article>`).join("\n") || `<p>${escapeHtml(texts.empty)}</p>`;
}

export function articlePage(shell, article, texts) {
  const file = articlePath(article.slug);
  const note = article.archived ? `<p class="article-note">${escapeHtml(texts.archive)}</p>` : "";
  return shell.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title>${escapeHtml(article.seoTitle || `${article.title} — МЕТЕОР`)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(article.description)}">`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${origin}/${file}">`)
    .replace(/<main>[\s\S]*?<\/main>/, `<main data-article-slug="${escapeHtml(article.slug)}"><section class="page-hero"><div class="section-inner"><p class="eyebrow"><a href="articles.html" data-copy="articles.text03">${escapeHtml(texts.text03)}</a></p><h1 class="compact-page-title" data-article-title>${escapeHtml(article.title)}</h1><p data-article-description>${escapeHtml(article.description)}</p><time datetime="${escapeHtml(article.date)}">${escapeHtml(article.date)}</time></div></section><section class="section white"><div class="section-inner content article-body" data-article-body>${note}${paragraphs(article.text)}</div></section><section class="section"><div class="section-inner"><a href="articles.html" data-copy="articles.back">${escapeHtml(texts.back)}</a></div></section></main>`);
}
