import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const root = resolve(".");
const errors = [];
const contentPath = join(root, "content", "site.json");

try {
  parseYaml(readFileSync(join(root, ".pages.yml"), "utf8"));
} catch (error) {
  errors.push(`.pages.yml: некорректная конфигурация (${error.message})`);
}

function fail(message) {
  errors.push(message);
}

function requiredString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label}: поле не заполнено`);
}

function localFile(value, label, extensions) {
  if (!value) return;
  if (/^https?:\/\//i.test(value)) return;
  const filePath = resolve(root, value);
  const relativePath = relative(root, filePath);
  if (relativePath.startsWith("..") || relativePath === ".." || isAbsolute(relativePath)) fail(`${label}: путь выходит за пределы проекта`);
  if (!existsSync(filePath)) fail(`${label}: файл не найден — ${value}`);
  if (extensions && !extensions.includes(extname(filePath).toLowerCase())) fail(`${label}: недопустимый формат — ${value}`);
}

let content;
try {
  content = JSON.parse(readFileSync(contentPath, "utf8"));
} catch (error) {
  fail(`content/site.json: некорректный JSON (${error.message})`);
  content = {};
}

requiredString(content.announcement?.title, "Объявление / заголовок");
requiredString(content.announcement?.intro, "Объявление / текст");
requiredString(content.schedule?.intro, "Расписание / вводный текст");

if (!Array.isArray(content.schedule?.groups) || !content.schedule.groups.length) {
  fail("Расписание: добавьте хотя бы одну группу");
} else {
  const names = new Set();
  content.schedule.groups.forEach((group, index) => {
    const label = `Расписание / группа ${index + 1}`;
    requiredString(group.name, `${label} / название`);
    requiredString(group.description, `${label} / описание`);
    if (!Array.isArray(group.sessions) || !group.sessions.length) {
      fail(`${label}: добавьте хотя бы один день занятий`);
    } else {
      const days = new Set();
      group.sessions.forEach((session, sessionIndex) => {
        const sessionLabel = `${label} / занятие ${sessionIndex + 1}`;
        if (!["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(session.day)) {
          fail(`${sessionLabel}: выберите день недели`);
        }
        requiredString(session.time, `${sessionLabel} / время`);
        if (days.has(session.day)) fail(`${sessionLabel}: день недели повторяется`);
        days.add(session.day);
      });
    }
    if (names.has(group.name)) fail(`${label}: название группы повторяется`);
    names.add(group.name);
  });
}

requiredString(content.contact?.address, "Контакты / адрес");
requiredString(content.contact?.phone, "Контакты / телефон");
requiredString(content.contact?.email, "Контакты / email");
if (!/^\+?[0-9 ()-]{10,24}$/.test(content.contact?.phone || "")) fail("Контакты / телефон: неверный формат");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(content.contact?.email || "")) fail("Контакты / email: неверный формат");
if (!/^https:\/\/yandex\.ru\/map-widget\//.test(content.contact?.mapUrl || "")) fail("Контакты / карта: нужна ссылка виджета Яндекс.Карт");

if (!Array.isArray(content.prices?.items) || !content.prices.items.length) fail("Цены: добавьте хотя бы один вариант занятий");

(content.news || []).forEach((item, index) => {
  if (!item.published) return;
  requiredString(item.date, `Новости / запись ${index + 1} / дата`);
  requiredString(item.title, `Новости / запись ${index + 1} / заголовок`);
  requiredString(item.text, `Новости / запись ${index + 1} / текст`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) fail(`Новости / запись ${index + 1}: дата должна иметь формат ГГГГ-ММ-ДД`);
  localFile(item.image, `Новости / запись ${index + 1} / фотография`, [".jpg", ".jpeg", ".png", ".webp"]);
  if (item.url && !/^(?:https?:\/\/|[^:]+$)/i.test(item.url)) fail(`Новости / запись ${index + 1}: недопустимая ссылка`);
});

(content.photos || []).forEach((item, index) => {
  if (!item.published) return;
  requiredString(item.alt, `Фото ${index + 1} / описание`);
  localFile(item.src, `Фото ${index + 1}`, [".jpg", ".jpeg", ".png", ".webp"]);
});

(content.videos || []).forEach((item, index) => {
  if (!item.published) return;
  requiredString(item.title, `Видео ${index + 1} / название`);
  if (item.kind === "rutube") {
    if (!/^https:\/\/(?:www\.)?rutube\.ru\/(?:video|shorts|play\/embed)\//.test(item.rutubeUrl || "")) fail(`Видео ${index + 1}: неверная ссылка Rutube`);
  } else if (item.kind === "mp4") {
    requiredString(item.src, `Видео ${index + 1} / файл`);
    localFile(item.src, `Видео ${index + 1}`, [".mp4", ".webm"]);
  } else {
    fail(`Видео ${index + 1}: неизвестный тип видео`);
  }
});

(content.beginnerMaterials || []).forEach((item, index) => {
  if (!item.published) return;
  requiredString(item.title, `Материал ${index + 1} / заголовок`);
  requiredString(item.text, `Материал ${index + 1} / текст`);
  localFile(item.url, `Материал ${index + 1}`, [".pdf", ".doc", ".docx"]);
});

for (const html of readdirSync(root).filter((name) => name.endsWith(".html"))) {
  const body = readFileSync(join(root, html), "utf8");
  for (const match of body.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const target = match[1].split("?")[0];
    if (/^(?:https?:|mailto:|tel:|data:)/i.test(target)) continue;
    if (!existsSync(resolve(dirname(join(root, html)), target))) fail(`${html}: локальная ссылка не найдена — ${target}`);
  }
}

if (errors.length) {
  console.error(`Проверка не пройдена (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("Проверка пройдена: данные CMS, медиафайлы и локальные ссылки корректны.");
}
