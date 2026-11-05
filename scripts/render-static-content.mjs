import { escapeHtml as esc, paragraphs, replaceContent } from "./site-render.mjs";
import { orderedNews, textCss } from "../assets/presentation.js";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const published = (item) => item.published !== false;
const safe = (value = "") => /^(?:https?:\/\/|\.?\/?[a-z0-9_-])/i.test(value) && !/^\w+:(?!\/\/)/.test(value) ? esc(value) : "";
const media = (src, alt) => /\.(?:mp4|webm)$/i.test(src) ? `<video src="${safe(src)}" controls preload="none" playsinline aria-label="${esc(alt)}"></video>` : src ? `<img src="${safe(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">` : "";

export function renderStaticContent(html, content) {
  const t = content.pageTexts.interface;
  const groups = content.schedule.groups;
  const phone = String(content.contact.phone).replace(/[^+\d]/g, "");
  const groupTime = (group) => group.sessions.filter((s) => s.time && s.time.toLowerCase() !== "нет").map((s) => `${t[`${s.day}Short`]} ${s.time}`).join(", ");
  html = replaceContent(html, "data-announcement", `<h2>${esc(content.announcement.title)}</h2><p>${esc(content.announcement.intro)}</p><strong>${esc(content.announcement.scheduleTitle)}</strong><p>${groups.map((g) => `<b>${esc(g.name)}:</b> ${esc(groupTime(g))}`).join("<br>")}</p><p><a href="contacts.html">${esc(content.announcement.directionsLabel)}</a> · <a href="tel:${phone}">${esc(content.contact.phone)}</a></p>`);
  html = html.replace(/(<aside\b[^>]*\bdata-announcement\b[^>]*)(>)/, (all, attrs, close) => attrs.replace(/\s+hidden\b/g, "") + (content.announcement.enabled === false ? " hidden" : "") + close);
  const activeDays = days.filter((day) => groups.some((g) => g.sessions.some((s) => s.day === day && s.time && s.time.toLowerCase() !== "нет")));
  html = replaceContent(html, "data-schedule-head", `<th>${esc(t.groupColumn)}</th>${activeDays.map((day) => `<th>${esc(t[day])}</th>`).join("")}`);
  html = replaceContent(html, "data-schedule-table", groups.map((g) => `<tr><td>${esc(g.name)}</td>${activeDays.map((day) => `<td>${esc(g.sessions.find((s) => s.day === day)?.time || "—")}</td>`).join("")}</tr>`).join("\n"));
  html = html.replace(/(<a\b[^>]*(?:data-contact-phone|class="top-phone")[^>]*>)[\s\S]*?(<\/a>)/g, (all, opening, closing) => opening.replace(/href="[^"]*"/, `href="tel:${phone}"`) + esc(content.contact.phone) + closing);
  html = html.replace(/(<a\b[^>]*data-contact-email[^>]*>)[\s\S]*?(<\/a>)/g, (all, opening, closing) => opening.replace(/href="[^"]*"/, `href="mailto:${esc(content.contact.email)}"`) + esc(content.contact.email) + closing);
  html = html.replace(/<iframe\b[^>]*data-contact-map[^>]*>/g, (tag) => tag.replace(/src="[^"]*"/, `src="${safe(content.contact.mapUrl)}"`));
  html = replaceContent(html, "data-prices-button", esc(content.prices.buttonLabel));
  const news = orderedNews(content.news);
  html = replaceContent(html, "data-news-list", news.map((n) => `<article class="card news-card${n.image ? " has-image" : ""}">${media(n.image, n.title)}<div class="news-card-body"><time datetime="${esc(n.date)}">${esc(n.date)}</time><h3 data-news-heading style="${esc(textCss(n.headingStyle))}">${esc(n.title)}</h3><p data-news-text style="${esc(textCss(n.textStyle))}">${esc(n.text)}</p>${safe(n.url) ? `<a class="news-link" href="${safe(n.url)}">${esc(n.linkLabel || t.more)}</a>` : ""}</div></article>`).join("\n"));
  html = html.replace(/<[\w-]+\b[^>]*data-text-style="([^"]+)"[^>]*>/g, (tag, path) => {
    const style = path.split(".").reduce((value, key) => value?.[key], content);
    return tag.replace(/\sstyle="[^"]*"/, "").replace(/>$/, ` style="${esc(textCss(style))}">`);
  });
  html = replaceContent(html, "data-beginner-materials", content.beginnerMaterials.filter(published).map((m) => `<article class="card"><h3>${esc(m.title)}</h3>${paragraphs(m.text)}${safe(m.url) ? `<a class="button material-link" href="${safe(m.url)}">${esc(m.linkText || t.materialLink)}</a>` : ""}</article>`).join("\n"));
  return html;
}
