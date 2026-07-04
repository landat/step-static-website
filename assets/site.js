const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const METEOR_ANALYTICS_ENDPOINT = "https://step-static-website.goatcounter.com/count";

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open");
  });
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
