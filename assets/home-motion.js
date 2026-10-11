// Progressive enhancement: all content is visible without JavaScript or animation support.
(() => {
  const tiles = document.querySelectorAll(".home-page [data-reveal]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!tiles.length || !window.IntersectionObserver || !Element.prototype.animate || reducedMotion.matches) return;

  const active = new Map();
  const visibleFraction = .15;
  // Keep the bottom quarter out of the trigger area. Use pixels: percentages
  // in IntersectionObserver rootMargin are relative to width, not height.
  const bottomInset = Math.round(window.innerHeight * .25);
  const observer = new IntersectionObserver((entries) => {
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < visibleFraction) continue;
      const tile = entry.target;
      observer.unobserve(tile);
      delete tile.dataset.revealPending;
      const distance = window.matchMedia("(max-width: 560px)").matches ? 36 : Math.min(220, window.innerWidth * .18);
      const offset = {
        left: [-distance, 0], right: [distance, 0], top: [0, -distance], bottom: [0, distance],
      }[tile.dataset.reveal] || [0, distance];
      const animation = tile.animate([
        { opacity: 0, transform: `translate(${offset[0]}px, ${offset[1]}px)` },
        { opacity: 1, transform: "translate(0, 0)" },
      ], { duration: 720, delay: Math.min(order++ * 70, 210), easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
      active.set(tile, animation);
      animation.onfinish = () => active.delete(tile);
    }
  }, { threshold: visibleFraction, rootMargin: `0px 0px -${bottomInset}px 0px` });

  for (const tile of tiles) {
    // A reload can restore the scroll position. Leave tiles already in view
    // visible instead of making the current screen disappear and animate again.
    const bounds = tile.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) continue;
    // Hide only after animation support is confirmed, avoiding a visible jump
    // from the resting position when the delayed entrance begins.
    tile.dataset.revealPending = "";
    observer.observe(tile);
  }
  window.addEventListener("pageshow", (event) => {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (!event.persisted && navigation?.type !== "reload" && navigation?.type !== "back_forward") return;
    requestAnimationFrame(() => {
      for (const tile of tiles) {
        const bounds = tile.getBoundingClientRect();
        if (bounds.top >= window.innerHeight || bounds.bottom <= 0) continue;
        observer.unobserve(tile);
        delete tile.dataset.revealPending;
        active.get(tile)?.cancel();
        active.delete(tile);
      }
    });
  });
  // A keyboard user must never have to wait for a moving link or video control.
  document.addEventListener("focusin", (event) => {
    const tile = event.target.closest("[data-reveal]");
    if (tile) {
      observer.unobserve(tile);
      delete tile.dataset.revealPending;
      active.get(tile)?.cancel();
      active.delete(tile);
    }
  });
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    for (const tile of tiles) delete tile.dataset.revealPending;
    for (const animation of active.values()) animation.cancel();
    active.clear();
  });
})();
