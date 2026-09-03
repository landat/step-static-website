const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const siteHeader = document.querySelector(".site-header");
const METEOR_ANALYTICS_ENDPOINT = "https://step-static-website.goatcounter.com/count";

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open");
  });
}

if (siteHeader) {
  const updateCompactHeader = () => {
    const compact = window.matchMedia("(max-width: 560px)").matches && window.scrollY > 90;
    siteHeader.classList.toggle("is-scrolled", compact);
  };

  updateCompactHeader();
  window.addEventListener("scroll", updateCompactHeader, { passive: true });
  window.addEventListener("resize", updateCompactHeader);
}

document.querySelectorAll(".site-nav a").forEach((link) => {
  const current = window.location.pathname.split("/").pop() || "index.html";
  if (link.getAttribute("href") === current) {
    link.setAttribute("aria-current", "page");
  }
});

function rutubeEmbedUrl(value) {
  if (!value) return "";
  if (value.includes("/play/embed/")) return value;
  const match = value.match(/rutube\.ru\/(?:video|shorts)\/([a-zA-Z0-9_-]+)/);
  return match ? `https://rutube.ru/play/embed/${match[1]}` : value;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderVideos() {
  const mount = document.querySelector("[data-video-catalog]");
  if (!mount) return;

  const videos = Array.isArray(window.METEOR_VIDEOS) ? window.METEOR_VIDEOS : [];

  if (!videos.length) {
    mount.innerHTML = `
      <div class="empty-state">
        Видео скоро появятся.
      </div>
    `;
    return;
  }

  if (mount.dataset.videoLayout === "inline") {
    const video = videos[0];
    const src = rutubeEmbedUrl(video.rutube);
    const media = video.src
      ? `<video src="${escapeHtml(video.src)}" controls preload="metadata" playsinline></video>`
      : `<iframe src="${escapeHtml(src)}" title="${escapeHtml(video.title)}" allow="clipboard-write; autoplay" allowfullscreen></iframe>`;

    mount.innerHTML = `<div class="video-frame">${media}</div>`;
    return;
  }

  mount.innerHTML = videos.map((video) => {
    const src = rutubeEmbedUrl(video.rutube);
    const media = video.src
      ? `<video src="${escapeHtml(video.src)}" controls preload="metadata" playsinline></video>`
      : `<iframe src="${escapeHtml(src)}" title="${escapeHtml(video.title)}" allow="clipboard-write; autoplay" allowfullscreen></iframe>`;

    return `
      <article class="video-card">
        <div class="video-frame">
          ${media}
        </div>
        <div class="video-body">
          ${video.title ? `<h3>${escapeHtml(video.title)}</h3>` : ""}
          ${video.description ? `<p>${escapeHtml(video.description)}</p>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

renderVideos();

function renderBeginnerMaterials() {
  const mount = document.querySelector("[data-beginner-materials]");
  if (!mount) return;

  const materials = Array.isArray(window.METEOR_BEGINNER_MATERIALS) ? window.METEOR_BEGINNER_MATERIALS : [];

  if (!materials.length) {
    mount.innerHTML = `
      <article class="card empty-state">
        Материалы скоро появятся.
      </article>
    `;
    return;
  }

  mount.innerHTML = materials.map((material) => {
    const paragraphs = Array.isArray(material.paragraphs) ? material.paragraphs : [];
    const body = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    const link = material.url
      ? `<a class="button material-link" href="${escapeHtml(material.url)}" target="_blank" rel="noreferrer">${escapeHtml(material.linkText || "Открыть материал")}</a>`
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

renderBeginnerMaterials();

function safeUrl(value, fallback = "") {
  const candidate = String(value || "").trim();
  if (!candidate) return fallback;
  if (/^(?:https?:|mailto:|tel:)/i.test(candidate) || !/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    return candidate;
  }
  return fallback;
}

function renderAnnouncement(announcement) {
  const mount = document.querySelector("[data-announcement]");
  if (!mount || !announcement) return;

  const groups = Array.isArray(announcement.groups) ? announcement.groups : [];
  const phoneHref = String(announcement.phone || "").replace(/[^+\d]/g, "");
  mount.innerHTML = `
    <h2>${escapeHtml(announcement.title)}</h2>
    <p>${escapeHtml(announcement.intro)}</p>
    <strong>${escapeHtml(announcement.scheduleTitle)}</strong>
    ${groups.map((group) => `<p><b>${escapeHtml(group.name)}:</b><br>${escapeHtml(group.time)}</p>`).join("")}
    <p>${escapeHtml(announcement.address)}</p>
    <p><a href="${escapeHtml(safeUrl(announcement.directionsUrl, "contacts.html"))}">${escapeHtml(announcement.directionsLabel || "Схема проезда")}</a><br><a href="tel:${escapeHtml(phoneHref)}">тел. ${escapeHtml(announcement.phone)}</a></p>
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

  const items = Array.isArray(news) ? news : [];
  section.hidden = items.length === 0;
  mount.innerHTML = items.map((item) => `
    <article class="card news-card">
      <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatNewsDate(item.date))}</time>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </article>
  `).join("");
}

function initPhotoCarousel(photos) {
  const carousel = document.querySelector("[data-photo-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-carousel-track]");
  const status = carousel.querySelector("[data-carousel-status]");
  const prev = carousel.querySelector(".carousel-prev");
  const next = carousel.querySelector(".carousel-next");
  const items = Array.isArray(photos) && photos.length
    ? photos
    : Array.from(track.querySelectorAll("img")).map((img) => ({ src: img.getAttribute("src"), alt: img.alt }));

  track.innerHTML = items.map((photo) => {
    const src = safeUrl(photo.src);
    return `<figure class="carousel-slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(photo.alt || "Фото школы бокса МЕТЕОР")}" loading="lazy"><figcaption>${escapeHtml(photo.alt || "Школа бокса МЕТЕОР")}</figcaption></figure>`;
  }).join("");

  let current = 0;
  let touchStartX = 0;
  const update = () => {
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
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });
  carousel.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  carousel.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
  }, { passive: true });
  carousel.tabIndex = 0;
  update();
}

async function loadEditableSiteContent() {
  try {
    const response = await fetch("content/site.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    const content = await response.json();
    renderAnnouncement(content.announcement);
    renderNews(content.news);
    initPhotoCarousel(content.photos);
  } catch (error) {
    initPhotoCarousel();
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
