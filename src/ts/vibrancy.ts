// Gives the glass panels their saturated look without a live backdrop-filter.
//
// A panel's `backdrop-filter` is re-run whenever anything inside it repaints, which for a scrolling
// list is every frame, and that was the largest GPU cost of the theme. The only thing behind the
// panels is the static album-art backdrop, so instead a second, saturated copy of that backdrop is
// kept behind them and clipped to the panels' outlines. The clip is rebuilt only when a panel moves
// or resizes.

import { selector as published } from "./selectors";

function roundedRect(x: number, y: number, w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const x2 = x + w;
  const y2 = y + h;
  return (
    `M${x + r} ${y}H${x2 - r}A${r} ${r} 0 0 1 ${x2} ${y + r}V${y2 - r}` +
    `A${r} ${r} 0 0 1 ${x2 - r} ${y2}H${x + r}A${r} ${r} 0 0 1 ${x} ${y2 - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

function radiusOf(el: Element, w: number, h: number): number {
  const value = getComputedStyle(el).borderTopLeftRadius;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return value.endsWith("%") ? (n / 100) * Math.min(w, h) : n;
}

export function trackPanels(shape: HTMLElement): void {
  const selector = published("panels");
  if (!selector) return;

  const watched = new Set<Element>();
  let frame = 0;

  const resizes = new ResizeObserver(() => schedule());

  function update(): void {
    frame = 0;
    let path = "";
    for (const el of document.querySelectorAll(selector)) {
      const box = el.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      path += roundedRect(box.x, box.y, box.width, box.height, radiusOf(el, box.width, box.height));
    }
    shape.style.clipPath = path ? `path('${path}')` : "inset(100%)";
  }

  function schedule(): void {
    if (!frame) frame = requestAnimationFrame(update);
  }

  // Panels can be replaced (sidebar toggled, library collapsed): observe any new ones, drop old ones.
  function rescan(): void {
    for (const el of watched) {
      if (!el.isConnected) {
        resizes.unobserve(el);
        watched.delete(el);
      }
    }
    for (const el of document.querySelectorAll(selector)) {
      if (!watched.has(el)) {
        watched.add(el);
        resizes.observe(el);
      }
    }
    schedule();
  }

  // Nodes added inside a panel (list rows, cards) cannot add or move a panel, so they are ignored;
  // that keeps this out of the way while scrolling.
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.target instanceof Element && !m.target.closest(selector)) {
        rescan();
        return;
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  window.addEventListener("resize", schedule);
  window.Spicetify?.Platform?.History?.listen(() => setTimeout(rescan, 100));
  rescan();
}
