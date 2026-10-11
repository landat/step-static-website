// Progressive enhancement: all content is visible without JavaScript or animation support.
(() => {
  const tiles = document.querySelectorAll(".home-page [data-reveal]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!tiles.length || !window.IntersectionObserver || !Element.prototype.animate || reducedMotion.matches) return;

  const active = new Map();
  const observer = new IntersectionObserver((entries) => {
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const tile = entry.target;
      observer.unobserve(tile);
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
  }, { threshold: .08, rootMargin: "0px 0px -24px 0px" });

  for (const tile of tiles) observer.observe(tile);
  // A keyboard user must never have to wait for a moving link or video control.
  document.addEventListener("focusin", (event) => {
    const tile = event.target.closest("[data-reveal]");
    if (tile) {
      observer.unobserve(tile);
      active.get(tile)?.cancel();
      active.delete(tile);
    }
  });
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    for (const animation of active.values()) animation.cancel();
    active.clear();
  });
})();
