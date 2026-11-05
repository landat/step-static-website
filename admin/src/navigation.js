import { editorShortcuts, sections } from "./sections.js";
import fieldOrder from "../navigation-fields.json";

export function setupNavigation() {
  const root = document.getElementById("nc-root");
  const sidebar = document.getElementById("section-sidebar");
  const menu = document.getElementById("section-menu");
  if (!root || !sidebar || !menu) return;
  const editorRoute = "#/collections/website/entries/site";
  let pending = null;
  let stopFollowing = () => {};

  function mountNestedField(path) {
    const split = path.lastIndexOf(".");
    if (split < 0) return false;
    const parentPath = path.slice(0, split);
    const parent = root.querySelector(`[data-key-path="${parentPath}"]`);
    const toggle = parent?.querySelector('button[aria-expanded][aria-controls]');
    const list = document.getElementById(toggle?.getAttribute("aria-controls"));
    const index = fieldOrder[parentPath]?.indexOf(path.slice(split + 1));
    if (!list || index === undefined || index < 0) return false;
    const slots = Array.from(list.children).filter((element) => element.matches('.placeholder, [data-key-path]'));
    if (!slots[index]) return false;
    slots[index].scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  }

  function revealSection(name) {
    const parts = name.split(".");
    for (let depth = 1; depth < parts.length; depth++) {
      const path = parts.slice(0, depth).join(".");
      const ancestor = root.querySelector(`[data-key-path="${path}"]`);
      if (!ancestor) {
        if (mountNestedField(path)) return false;
        break;
      }
      const toggle = ancestor.querySelector('button[aria-expanded][aria-controls]');
      if (ancestor.dataset.fieldType === "object" && toggle?.getAttribute("aria-expanded") === "false") {
        toggle.click();
        ancestor.scrollIntoView({ block: "start", behavior: "instant" });
        return false;
      }
    }
    const field = root.querySelector(`[data-key-path="${name}"]`);
    if (!field) {
      // Later fields mount lazily. Bring the nearest preceding section into view
      // so the requested field can mount and sync() can finish the jump.
      const index = sections.findIndex((section) => section.name === parts[0]);
      if (mountNestedField(name)) return false;
      const preceding = sections.slice(0, index).reverse()
        .map((section) => root.querySelector(`[data-key-path="${section.name}"]`))
        .find(Boolean);
      preceding?.scrollIntoView({ block: "end", behavior: "instant" });
      return false;
    }
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

  const navigation = sections.flatMap((section) => section.name === "home" ? [section, ...editorShortcuts] : [section]);
  for (const section of navigation) {
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
