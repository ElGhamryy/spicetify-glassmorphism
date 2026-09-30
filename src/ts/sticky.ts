// Two scroll fixes Spotify does not give us:
//  1. The pinned track-list header gets no "stuck" class, so detect it. It turns solid only while
//     pinned under the top bar; at rest it stays transparent.
//  2. The artist-page photo is pinned behind the content while the page scrolls. Move it up with the
//     scroll so it leaves with the page instead of hanging behind everything.

const TOP_BAR_HEIGHT = 64;
// Wrapper around an artist/playlist header photo: the photo layers carry an inline background-image.
const HERO = ".before-scroll-node > div:has(> [style*=\"background-image\"])";

export function initSticky(): void {
  let frame = 0;
  let scrollTop = 0;

  function update(): void {
    frame = 0;
    const view = document.querySelector<HTMLElement>(".Root__main-view");
    if (!view) return;

    const header = document.querySelector<HTMLElement>(".main-trackList-trackListHeader");
    if (header) {
      const stuck = header.getBoundingClientRect().top <= view.getBoundingClientRect().top + TOP_BAR_HEIGHT + 2;
      header.classList.toggle("glass-stuck", stuck);
    }

    const hero = document.querySelector<HTMLElement>(HERO);
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
    setTimeout(update, 50);
  });
}
