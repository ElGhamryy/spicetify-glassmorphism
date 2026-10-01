// Two scroll fixes Spotify does not give us:
//  1. The pinned track-list header gets no "stuck" class, so detect it. It turns solid only while
//     pinned under the top bar; at rest it stays transparent.
//  2. The artist-page photo is pinned behind the content while the page scrolls. Move it up with the
//     scroll so it leaves with the page instead of hanging behind everything.

const TOP_BAR_HEIGHT = 64;
// Photo layer of an artist/playlist header: it carries an inline background-image. Its parent is the
// "hero" wrapper. This is looked up in script and marked with a class, because the equivalent CSS
// (:has() over a style attribute) is re-evaluated every time Spotify rewrites a row's inline style,
// which is constantly while scrolling a list, and made scrolling about twice as expensive.
const HERO_PHOTO = ".before-scroll-node > div > [style*=\"background-image\"]";

export function initSticky(): void {
  let frame = 0;
  let scrollTop = 0;
  let hero: HTMLElement | null = null;

  function markHero(): void {
    const wrapper = document.querySelector(HERO_PHOTO)?.parentElement ?? null;
    if (wrapper !== hero) {
      hero?.classList.remove("glass-hero");
      hero?.style.removeProperty("transform");
      hero = wrapper;
      hero?.classList.add("glass-hero");
    }
    document.documentElement.toggleAttribute("data-glass-hero", !!hero);
  }

  // Runs inside the mutation callback, before the next paint, so the fade is there on the first
  // frame. Only the node, its parent and grandparent are tested: the wrapper's depth below
  // .before-scroll-node is fixed, and this must stay O(1) for the rows a list adds while scrolling.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (!(n instanceof Element)) continue;
        const p = n.parentElement;
        if (
          n.classList.contains("before-scroll-node") ||
          p?.classList.contains("before-scroll-node") ||
          p?.parentElement?.classList.contains("before-scroll-node")
        ) {
          markHero();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
  markHero();

  function update(): void {
    frame = 0;
    const view = document.querySelector<HTMLElement>(".Root__main-view");
    if (!view) return;

    const header = document.querySelector<HTMLElement>(".main-trackList-trackListHeader");
    if (header) {
      const stuck = header.getBoundingClientRect().top <= view.getBoundingClientRect().top + TOP_BAR_HEIGHT + 2;
      header.classList.toggle("glass-stuck", stuck);
    }

    if (hero) hero.style.transform = scrollTop > 0 ? `translate3d(0, ${-scrollTop}px, 0)` : "";
  }

  // Scroll events do not bubble, so listen in the capture phase on the document.
  document.addEventListener(
    "scroll",
    (e) => {
      const target = e.target;
      // Only the main view's own scroller drives the hero; ignore sidebar and list scrolling.
      if (target instanceof HTMLElement && target.closest(".Root__main-view") && target.scrollHeight > target.clientHeight + 100) {
        scrollTop = target.scrollTop;
      }
      if (!frame) frame = requestAnimationFrame(update);
    },
    { capture: true, passive: true },
  );
  window.Spicetify?.Platform?.History?.listen(() => {
    scrollTop = 0;
    // The new page's header may reuse the old nodes, so re-check once it has rendered.
    for (const ms of [0, 150, 500]) setTimeout(markHero, ms);
    setTimeout(update, 50);
  });
}
