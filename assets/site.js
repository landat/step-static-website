let pageTextValues = {};
function copyText(key, fallback = "") {
  const value = key.split(".").reduce((item, part) => item?.[part], pageTextValues);
  return value === null ? "" : typeof value === "string" ? value : fallback;
}
function renderPageTexts(values) {
  pageTextValues = values || {};
  document.querySelectorAll("[data-copy]").forEach((element) => {
    element.textContent = copyText(element.dataset.copy, element.textContent);
  });
  for (const attribute of ["alt", "aria-label", "title", "content"]) {
    document.querySelectorAll(`[data-copy-${attribute}]`).forEach((element) => {
      element.setAttribute(attribute, copyText(element.getAttribute(`data-copy-${attribute}`), element.getAttribute(attribute)));
    });
  }
  document.querySelectorAll(".brand-fallback").forEach((element) => { element.textContent = copyText("interface.brandShort", "МЕТЕОР"); });
}

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const siteHeader = document.querySelector(".site-header");
const METEOR_ANALYTICS_ENDPOINT = "https://step-static-website.goatcounter.com/count";
const METEOR_YANDEX_METRIKA_ID = "18677428";
const ANALYTICS_CONSENT_KEY = "meteor-analytics-consent";
const SCHEDULE_DAYS = [
  { value: "monday", label: "Понедельник", short: "пн." },
  { value: "tuesday", label: "Вторник", short: "вт." },
  { value: "wednesday", label: "Среда", short: "ср." },
  { value: "thursday", label: "Четверг", short: "чт." },
  { value: "friday", label: "Пятница", short: "пт." },
  { value: "saturday", label: "Суббота", short: "сб." },
  { value: "sunday", label: "Воскресенье", short: "вс." }
];

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open");
  });
}

if (siteHeader) {
  const updateCompactHeader = () => {
    const wasCompact = siteHeader.classList.contains("is-scrolled");
    const compact = wasCompact ? window.scrollY > 20 : window.scrollY > 260;
    siteHeader.classList.toggle("is-scrolled", compact);
  };

  updateCompactHeader();
  window.addEventListener("scroll", updateCompactHeader, { passive: true });
  window.addEventListener("resize", updateCompactHeader);
}

function ensureHeaderContact(address = "") {
  const phone = document.querySelector(".top-phone");
  if (!phone) return;

  let container = phone.closest(".header-contact");
  if (!container) {
    container = document.createElement("div");
    container.className = "header-contact";
    phone.before(container);
    container.appendChild(phone);
  }

  let addressElement = container.querySelector(".top-address");
  if (!addressElement) {
    addressElement = document.createElement("span");
    addressElement.className = "top-address";
    container.appendChild(addressElement);
  }
  addressElement.textContent = address;
}

function compactHeaderAddress(address = "") {
  return String(address).replace(/,\s*здание ДОСААФ.*$/i, "").trim();
}

ensureHeaderContact();

document.querySelectorAll(".site-nav a").forEach((link) => {
  const current = window.location.pathname.split("/").pop() || "index.html";
  if (link.getAttribute("href") === current) {
    link.setAttribute("aria-current", "page");
  }
});

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function isPublished(item) {
  return item && item.published !== false;
}

function textParagraphs(value) {
  return String(value || "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function rutubeEmbedUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["rutube.ru", "www.rutube.ru"].includes(url.hostname.toLowerCase())) return "";
    const match = url.pathname.match(/^\/(?:video|shorts|play\/embed)\/([^/?#]+)/i);
    return match ? `https://rutube.ru/play/embed/${encodeURIComponent(match[1])}` : "";
  } catch {
    return "";
  }
}

function videoMedia(video) {
  if (video.kind === "rutube") {
    const embedUrl = rutubeEmbedUrl(video.rutubeUrl);
    return embedUrl
      ? `<iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(video.title || copyText("interface.rutubeTitle", "Видео с Rutube"))}" allow="clipboard-write; autoplay" allowfullscreen></iframe>`
      : "";
  }
  const src = safeUrl(video.src);
  return src ? `<video src="${escapeHtml(src)}" controls preload="metadata" playsinline></video>` : "";
}

function renderVideos(source) {
  const mount = document.querySelector("[data-video-catalog]");
  if (!mount) return;

  const videos = Array.isArray(source) ? source.filter(isPublished) : [];

  if (!videos.length) {
    mount.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(copyText("interface.emptyVideos", "Видео скоро появятся."))}
      </div>
    `;
    return;
  }

  mount.innerHTML = videos.map((video) => {
    const media = videoMedia(video);

    return `
      <article class="video-card">
        ${media ? `<div class="video-frame">${media}</div>` : `<div class="empty-state">${escapeHtml(copyText("interface.invalidVideo", "Проверьте источник видео в CMS."))}</div>`}
        <div class="video-body">
          ${video.title ? `<h3>${escapeHtml(video.title)}</h3>` : ""}
          ${video.description ? `<p>${escapeHtml(video.description)}</p>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function renderBeginnerMaterials(source) {
  const mount = document.querySelector("[data-beginner-materials]");
  if (!mount) return;

  const materials = Array.isArray(source) ? source.filter(isPublished) : [];

  if (!materials.length) {
    mount.innerHTML = `
      <article class="card empty-state">
        ${escapeHtml(copyText("interface.emptyMaterials", "Материалы скоро появятся."))}
      </article>
    `;
    return;
  }

  mount.innerHTML = materials.map((material) => {
    const paragraphs = material.text
      ? textParagraphs(material.text)
      : (Array.isArray(material.paragraphs) ? material.paragraphs : []);
    const body = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    const link = material.url
      ? `<a class="button material-link" href="${escapeHtml(material.url)}" target="_blank" rel="noreferrer">${escapeHtml(material.linkText || copyText("interface.materialLink", "Открыть материал"))}</a>`
      : "";

    return `
      <article class="card">
        <h3>${escapeHtml(material.title)}</h3>
        ${body}
        ${link}
      </article>
    `;
  }).join("");
}

function safeUrl(value, fallback = "") {
  const candidate = String(value || "").trim();
  if (!candidate) return fallback;
  if (/^(?:https?:|mailto:|tel:)/i.test(candidate) || !/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    return candidate;
  }
  return fallback;
}

function isVideoFile(src) {
  return /\.(mp4|webm)(?:[?#]|$)/i.test(String(src || ""));
}

function siteMedia(src, description) {
  src = safeUrl(src);
  if (!src) return "";
  const label = escapeHtml(description || copyText("interface.brand", "Школа бокса МЕТЕОР"));
  return isVideoFile(src)
    ? `<video src="${escapeHtml(src)}" aria-label="${label}" controls playsinline preload="none"></video>`
    : `<img src="${escapeHtml(src)}" alt="${label}" loading="lazy" decoding="async">`;
}

function replacePhotoWithMedia(image, src, description) {
  if (isVideoFile(src)) {
    const video = document.createElement("video");
    video.className = image.className;
    for (const [key, value] of Object.entries(image.dataset)) video.dataset[key] = value;
    video.src = src;
    video.controls = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-label", description);
    image.replaceWith(video);
  } else {
    image.removeAttribute("srcset");
    image.removeAttribute("sizes");
    image.src = src;
    image.alt = description;
  }
}

function groupScheduleText(group) {
  return scheduleSessions(group).map((session) => {
    const day = SCHEDULE_DAYS.find((item) => item.value === session.day);
    return `${day?.short || session.day}: ${session.time}`;
  }).join("; ");
}

function scheduleSessions(group) {
  if (Array.isArray(group?.sessions)) {
    return group.sessions.filter((session) => session?.day && session?.time && String(session.time).toLowerCase() !== "нет");
  }

  return [
    { day: "monday", time: group?.monday },
    { day: "wednesday", time: group?.wednesday },
    { day: "friday", time: group?.friday }
  ].filter((session) => session.time && String(session.time).toLowerCase() !== "нет");
}

function renderAnnouncement(announcement, schedule, contact) {
  const mount = document.querySelector("[data-announcement]");
  if (!mount || !announcement) return;

  mount.hidden = announcement.enabled === false;
  if (mount.hidden) return;
  const groups = Array.isArray(schedule?.groups) ? schedule.groups : [];
  const phoneHref = String(contact?.phone || "").replace(/[^+\d]/g, "");
  mount.innerHTML = `
    <h2>${escapeHtml(announcement.title)}</h2>
    <p>${escapeHtml(announcement.intro)}</p>
    <strong>${escapeHtml(announcement.scheduleTitle)}</strong>
    <p>${groups.map((group) => `<b>${escapeHtml(group.name)}:</b> ${escapeHtml(groupScheduleText(group))}`).join("<br>")}</p>
    <p><a href="contacts.html">${escapeHtml(announcement.directionsLabel || copyText("interface.directionsLink", "Схема проезда"))}</a> · <a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(contact?.phone)}</a></p>
  `;
}

function formatNewsDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function renderNews(news) {
  const mount = document.querySelector("[data-news-list]");
  const section = document.querySelector("[data-news-section]");
  if (!mount || !section) return;

  const items = Array.isArray(news)
    ? news.filter(isPublished).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.date || "").localeCompare(String(a.date || "")))
    : [];
  section.hidden = items.length === 0;
  mount.innerHTML = items.map((item) => {
    const image = safeUrl(item.image);
    const url = safeUrl(item.url);
    return `
    <article class="card news-card${image ? " has-image" : ""}">
      ${siteMedia(image, item.title || copyText("interface.newsImage", "Новость школы бокса МЕТЕОР"))}
      <div class="news-card-body">
      <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatNewsDate(item.date))}</time>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
      ${url ? `<a class="news-link" href="${escapeHtml(url)}">${escapeHtml(item.linkLabel || copyText("interface.more", "Подробнее"))}</a>` : ""}
      </div>
    </article>
  `;
  }).join("");
}

function initPhotoCarousel(photos) {
  const carousel = document.querySelector("[data-photo-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-carousel-track]");
  const status = carousel.querySelector("[data-carousel-status]");
  const prev = carousel.querySelector(".carousel-prev");
  const next = carousel.querySelector(".carousel-next");
  const items = Array.isArray(photos)
    ? photos.filter(isPublished)
    : Array.from(track.querySelectorAll("img")).map((img) => ({ src: img.getAttribute("src"), alt: img.alt }));

  if (!items.length) {
    track.innerHTML = `<div class="empty-state">${escapeHtml(copyText("interface.emptyGallery", "Фото и видео скоро появятся."))}</div>`;
    prev.hidden = true;
    next.hidden = true;
    status.textContent = "0 / 0";
    return;
  }

  track.innerHTML = items.map((photo) => {
    const src = safeUrl(photo.src);
    return `<figure class="carousel-slide">${siteMedia(src, photo.alt)}<figcaption>${escapeHtml(photo.alt || copyText("interface.brand", "Школа бокса МЕТЕОР"))}</figcaption></figure>`;
  }).join("");

  let current = 0;
  let touchStartX = 0;
  const update = () => {
    track.querySelectorAll(".carousel-slide").forEach((slide, index) => {
      slide.inert = index !== current;
      if (index !== current) slide.querySelectorAll("video").forEach((video) => video.pause());
    });
    track.style.transform = `translateX(-${current * 100}%)`;
    status.textContent = `${current + 1} / ${items.length}`;
  };
  const move = (step) => {
    current = (current + step + items.length) % items.length;
    update();
  };

  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  carousel.addEventListener("keydown", (event) => {
    if (event.target.closest("video")) return;
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });
  carousel.addEventListener("touchstart", (event) => { touchStartX = event.target.closest("video") ? null : event.changedTouches[0].clientX; }, { passive: true });
  carousel.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
  }, { passive: true });
  carousel.tabIndex = 0;
  update();
}

function renderSchedule(schedule, contact) {
  if (!schedule) return;
  document.querySelectorAll("[data-schedule-intro]").forEach((element) => {
    element.textContent = schedule.intro || "";
  });
  const groups = Array.isArray(schedule.groups) ? schedule.groups : [];
  const activeDays = SCHEDULE_DAYS.filter((day) => groups.some((group) => scheduleSessions(group).some((session) => session.day === day.value)));
  document.querySelectorAll("[data-schedule-head]").forEach((row) => {
    row.innerHTML = `<th>${escapeHtml(copyText("interface.groupColumn", "Группа"))}</th>${activeDays.map((day) => `<th>${escapeHtml(day.label)}</th>`).join("")}`;
  });
  document.querySelectorAll("[data-schedule-table]").forEach((tbody) => {
    tbody.innerHTML = groups.map((group) => {
      const sessions = scheduleSessions(group);
      return `<tr><td>${escapeHtml(group.name)}</td>${activeDays.map((day) => {
        const time = sessions.find((session) => session.day === day.value)?.time || "—";
        return `<td>${escapeHtml(time)}</td>`;
      }).join("")}</tr>`;
    }).join("");
  });
  document.querySelectorAll("[data-schedule-groups]").forEach((mount) => {
    mount.innerHTML = groups.map((group) => `<article class="card"><h3>${escapeHtml(group.name)}</h3><p>${escapeHtml(group.description)}</p></article>`).join("");
  });
  document.querySelectorAll("[data-schedule-address]").forEach((element) => {
    element.textContent = contact?.address || "";
  });
}

function renderContact(contact) {
  if (!contact) return;
  ensureHeaderContact(compactHeaderAddress(contact.address || ""));
  const phoneHref = String(contact.phone || "").replace(/[^+\d]/g, "");
  document.querySelectorAll(".top-phone, [data-contact-phone]").forEach((element) => {
    element.textContent = contact.phone || "";
    element.setAttribute("href", `tel:${phoneHref}`);
  });
  document.querySelectorAll(".brand img").forEach((image) => {
    image.alt = copyText("interface.brand", "Школа бокса МЕТЕОР");
  });
  document.querySelectorAll("[data-contact-address]").forEach((element) => { element.textContent = contact.address || ""; });
  document.querySelectorAll("[data-contact-email]").forEach((element) => {
    element.textContent = contact.email || "";
    element.setAttribute("href", `mailto:${contact.email || ""}`);
  });
  document.querySelectorAll("[data-contact-directions]").forEach((element) => {
    element.innerHTML = textParagraphs(contact.directions).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  });
  const mapUrl = safeUrl(contact.mapUrl);
  document.querySelectorAll("[data-contact-map]").forEach((element) => {
    if (mapUrl && element.getAttribute("src") !== mapUrl) element.setAttribute("src", mapUrl);
  });
}

function renderAbout(about) {
  if (!about) return;
  document.querySelectorAll("[data-about-title]").forEach((element) => { element.textContent = about.title || ""; });
  document.querySelectorAll("[data-about-text]").forEach((element) => {
    element.innerHTML = textParagraphs(about.text).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  });
  document.querySelectorAll("[data-about-photo]").forEach((image) => {
    const src = safeUrl(about.image);
    image.hidden = !src;
    if (src) replacePhotoWithMedia(image, src, about.imageAlt || copyText("interface.brand", "Школа бокса МЕТЕОР"));
    else image.removeAttribute("src");
    image.alt = about.imageAlt || copyText("interface.brand", "Школа бокса МЕТЕОР");
  });
}

function renderHomeImages(home) {
  const directionPhoto = document.querySelector("[data-directions-photo]");
  const directionsImage = safeUrl(home?.directionsImage);
  if (directionPhoto && directionsImage) {
    replacePhotoWithMedia(directionPhoto, directionsImage, copyText("interface.directionsMedia", "Основные направления школы бокса МЕТЕОР"));
  }
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;
  const selected = safeUrl(home?.heroImage, "assets/optimized/hero.webp");
  const src = isVideoFile(selected) ? "assets/optimized/hero.webp" : selected;
  // CSS variables containing relative URLs resolve against the stylesheet, not the page.
  hero.style.setProperty("--hero-image", `url(${JSON.stringify(new URL(src, document.baseURI).href)})`);
  if (isVideoFile(selected)) {
    const video = document.createElement("video");
    video.className = "hero-video";
    video.src = selected;
    video.preload = "none";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button light hero-video-toggle";
    button.textContent = copyText("interface.heroPlay", "Включить видео на фоне");
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", async () => {
      if (!video.paused) { video.pause(); return; }
      button.disabled = true;
      try { await video.play(); }
      catch { button.textContent = copyText("interface.heroRetry", "Видео не загрузилось — повторить"); }
      finally { button.disabled = false; }
    });
    video.addEventListener("playing", () => {
      hero.classList.add("is-video-playing");
      button.textContent = copyText("interface.heroPause", "Приостановить видео");
      button.setAttribute("aria-pressed", "true");
    });
    video.addEventListener("pause", () => {
      button.textContent = copyText("interface.heroResume", "Продолжить видео");
      button.setAttribute("aria-pressed", "false");
    });
    hero.prepend(video);
    hero.querySelector(".hero-copy").append(button);
  }
}

function renderPrices(prices) {
  if (!prices) return;
  document.querySelectorAll("[data-prices-intro]").forEach((element) => { element.textContent = prices.intro || ""; });
  document.querySelectorAll("[data-price-items]").forEach((mount) => {
    const items = Array.isArray(prices.items) ? prices.items : [];
    mount.innerHTML = items.map((item) => `<article class="card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join("");
  });
  document.querySelectorAll("[data-prices-explanation-title]").forEach((element) => { element.textContent = prices.explanationTitle || ""; });
  document.querySelectorAll("[data-prices-explanation]").forEach((element) => {
    element.innerHTML = textParagraphs(prices.explanation).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  });
  document.querySelectorAll("[data-prices-button]").forEach((element) => { element.textContent = prices.buttonLabel || copyText("interface.priceButton", "Узнать стоимость"); });
}

function showContentWarning() {
  const main = document.querySelector("main");
  if (!main || document.querySelector(".content-warning")) return;
  main.insertAdjacentHTML("afterbegin", `<p class="content-warning" role="status">${escapeHtml(copyText("interface.contentError", "Часть информации временно недоступна. Уточните расписание и контакты по телефону."))}</p>`);
}

async function loadEditableSiteContent() {
  try {
    // Revalidate on every visit, while allowing an unchanged document to return 304.
    const response = await fetch("content/site.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    const content = await response.json();
    pageTextValues = content.pageTexts || {};
    for (const day of SCHEDULE_DAYS) {
      day.label = copyText(`interface.${day.value}`, day.label);
      day.short = copyText(`interface.${day.value}Short`, day.short);
    }
    renderAnnouncement(content.announcement, content.schedule, content.contact);
    renderSchedule(content.schedule, content.contact);
    renderContact(content.contact);
    renderPrices(content.prices);
    renderAbout(content.about);
    renderHomeImages(content.home);
    renderNews(content.news);
    initPhotoCarousel(content.photos);
    renderVideos(content.videos);
    renderBeginnerMaterials(content.beginnerMaterials);
    renderPageTexts(content.pageTexts);
  } catch (error) {
    renderHomeImages();
    initPhotoCarousel();
    renderVideos([]);
    renderBeginnerMaterials([]);
    showContentWarning();
    console.warn("Editable site content could not be loaded.", error);
  }
}

loadEditableSiteContent();

function analyticsPath() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/index.html";
  const productionHosts = ["meteorboxing.ru", "www.meteorboxing.ru"];
  return productionHosts.includes(window.location.hostname) ? path : `/${window.location.hostname}${path}`;
}

function loadPrivacySafeAnalytics() {
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname) || window.location.protocol === "file:";
  const doNotTrack = navigator.doNotTrack === "1" || window.doNotTrack === "1";

  if (!METEOR_ANALYTICS_ENDPOINT || isLocal || doNotTrack) return;

  window.goatcounter = {
    no_events: true,
    path: analyticsPath,
    referrer: () => ""
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = METEOR_ANALYTICS_ENDPOINT;
  document.head.appendChild(script);
}

loadPrivacySafeAnalytics();

function loadYandexMetrika() {
  const id = Number(METEOR_YANDEX_METRIKA_ID);
  if (!Number.isInteger(id) || id <= 0 || window.ym) return;

  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(script);
  window.ym(id, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true
  });
}

function storedAnalyticsConsent() {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch {
    return null;
  }
}

function saveAnalyticsConsent(value) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
  } catch {
    // Сайт продолжает работать, даже если браузер запретил локальное хранилище.
  }
}

function showCookieConsent() {
  const saved = storedAnalyticsConsent();
  if (saved === "accepted") {
    loadYandexMetrika();
    return;
  }
  if (saved === "declined") return;

  const banner = document.createElement("section");
  banner.className = "cookie-consent";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("data-copy-aria-label", "interface.consentTitle");
  banner.setAttribute("aria-label", copyText("interface.consentTitle", "Согласие на использование аналитики"));
  banner.innerHTML = `
    <p data-copy="interface.consentText">Сайт использует обезличенную статистику. Яндекс Метрика будет подключена только с вашего согласия.</p>
    <div class="cookie-actions">
      <button class="cookie-accept" type="button" data-copy="interface.consentAccept">Разрешить</button>
      <button class="cookie-decline" type="button" data-copy="interface.consentDecline">Только необходимые</button>
    </div>
  `;
  banner.querySelector(".cookie-accept").addEventListener("click", () => {
    saveAnalyticsConsent("accepted");
    banner.remove();
    loadYandexMetrika();
  });
  banner.querySelector(".cookie-decline").addEventListener("click", () => {
    saveAnalyticsConsent("declined");
    banner.remove();
  });
  document.body.appendChild(banner);
}

showCookieConsent();
