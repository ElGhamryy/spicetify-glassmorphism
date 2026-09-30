// Many Spotify pages paint solid bands with hashed class names that change between releases
// (Home sections, shelf headers, shortcut tiles). Instead of chasing class names, find elements
// inside the panels whose computed background is exactly the scheme's "main" or "main-elevated"
// color and mark them, so CSS can make them transparent or glass.
//
// Scanning reads layout and styles, so it only looks at nodes that were just added (plus one full
// pass on load and after navigation), and it runs in a single frame after changes settle.

const SCOPES = ".Root__main-view, .Root__right-sidebar-peek";
const MIN_W = 120;
const MIN_H = 36;

function toRgb(value: string): string {
  const hex = value.trim().replace("#", "");
  if (hex.length !== 6) return "";
  const n = parseInt(hex, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

export function initOpaque(): void {
  const root = getComputedStyle(document.documentElement);
  const main = toRgb(root.getPropertyValue("--spice-main"));
  const elevated = toRgb(root.getPropertyValue("--spice-main-elevated"));
  if (!main) return;

  const pending = new Set<Element>();
  let fullScan = true;
  let timer = 0;

  function check(el: HTMLElement, sidebar: boolean): void {
    const r = el.getBoundingClientRect();
    if (r.width < MIN_W || r.height < MIN_H) return;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    if (bg === main) {
      el.classList.add("glass-clear");
    } else if (elevated && bg === elevated) {
      // Leave image holders (cover art, entity images) alone.
      if (/cover-art|entityImage/.test(el.className)) return;
      // In the sidebar the cards are already glass, so solid boxes inside them are cleared, not re-filled.
      if (sidebar) el.classList.add("glass-clear");
      else if (!el.querySelector("img")) el.classList.add("glass-soft");
    }
    if (cs.backgroundImage.includes(main)) el.classList.add("glass-clear-image");
  }

  function scanTree(top: Element): void {
    const scope = top.closest<HTMLElement>(SCOPES);
    if (!scope) return;
    const sidebar = scope.classList.contains("Root__right-sidebar-peek");
    if (top instanceof HTMLElement && top.matches("div, section, header")) check(top, sidebar);
    for (const el of top.querySelectorAll<HTMLElement>("div, section, header")) check(el, sidebar);
  }

  function run(): void {
    timer = 0;
    if (fullScan) {
      fullScan = false;
      pending.clear();
      document.querySelectorAll(SCOPES).forEach(scanTree);
      return;
    }
    const batch = [...pending];
    pending.clear();
    for (const node of batch) if (node.isConnected) scanTree(node);
  }

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => requestAnimationFrame(run), 120);
  };

  new MutationObserver((mutations) => {
    let queued = false;
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n instanceof Element && n.closest(SCOPES)) {
          pending.add(n);
          queued = true;
        }
      }
    }
    if (queued) schedule();
  }).observe(document.body, { childList: true, subtree: true });

  window.Spicetify?.Platform?.History?.listen(() => {
    fullScan = true;
    schedule();
  });
  schedule();
}
