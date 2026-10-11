import { sections } from "./sections.js";

export function setupNavigation() {
  const root = document.getElementById("nc-root");
  const sidebar = document.getElementById("section-sidebar");
  const menu = document.getElementById("section-menu");
  if (!root || !sidebar || !menu) return;
  const editorRoute = "#/collections/website/entries/site";
  let pending = null;
  let stopFollowing = () => {};

  function revealSection(name) {
    const field = root.querySelector(`[data-key-path="${name}"]`);
    if (!field) return false;
    // Only expand the top-level object, never toggle an already open section.
    const toggle = field.querySelector('button[aria-expanded][aria-controls]');
    if (field.dataset.fieldType === "object" && toggle?.getAttribute("aria-expanded") === "false") toggle.click();
    field.tabIndex = -1;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ block: "start", behavior: "instant" });
    // Sveltia mounts offscreen widgets lazily. Keep the chosen heading in place
    // while their sizes settle, but stop as soon as the user interacts again.
    stopFollowing();
    const resize = new ResizeObserver(() => field.scrollIntoView({ block: "start", behavior: "instant" }));
    for (const item of root.querySelectorAll('section[data-key-path]:not([data-key-path*="."])')) resize.observe(item);
    const events = ["wheel", "touchstart", "pointerdown", "keydown"];
    const timer = setTimeout(() => stop(), 1500);
    function stop() {
      resize.disconnect();
      clearTimeout(timer);
      for (const event of events) document.removeEventListener(event, stop, true);
    }
    for (const event of events) document.addEventListener(event, stop, { capture: true, once: true });
    stopFollowing = stop;
    for (const button of menu.querySelectorAll("button")) {
      if (button.dataset.section === name) button.setAttribute("aria-current", "location");
      else button.removeAttribute("aria-current");
    }
    return true;
  }

  for (const section of sections) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.section = section.name;
    const label = document.createElement("strong");
    label.textContent = section.label;
    const description = document.createElement("span");
    description.textContent = section.description;
    button.append(label, description);
    button.addEventListener("click", () => {
      if (revealSection(section.name)) return;
      pending = section.name;
      if (location.hash !== editorRoute) location.hash = editorRoute;
    });
    menu.append(button);
  }

  function sync() {
    sidebar.hidden = !root.querySelector('#collection-container, [data-key-path="announcement"]');
    if (pending && revealSection(pending)) pending = null;
  }
  new MutationObserver(sync).observe(root, { childList: true, subtree: true });
  sync();
}
