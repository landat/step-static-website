const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

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

  mount.innerHTML = videos.map((video) => {
    const src = rutubeEmbedUrl(video.rutube);
    return `
      <article class="video-card">
        <div class="video-frame">
          <iframe src="${src}" title="${video.title}" allow="clipboard-write; autoplay" allowfullscreen></iframe>
        </div>
        <div class="video-body">
          <h3>${video.title}</h3>
          ${video.description ? `<p>${video.description}</p>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

renderVideos();
