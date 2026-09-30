// Album-art backdrop: two layers crossfade whenever the track changes.
//
// Each layer is a tiny canvas (blur, saturation and brightness are applied while drawing) that CSS
// stretches to the full window. A CSS `filter: blur()` on a window-sized layer is rendered in GPU
// tiles and leaves visible horizontal seams; smooth upscaling of a small image does not.

const IMAGE_PREFIX = "spotify:image:";
const CDN = "https://i.scdn.co/image/";
const W = 64;
const H = 36;

function artUrl(): string | null {
  const meta = window.Spicetify?.Player?.data?.item?.metadata;
  const raw = meta?.image_xlarge_url ?? meta?.image_large_url ?? meta?.image_url;
  if (!raw) return null;
  return raw.startsWith(IMAGE_PREFIX) ? CDN + raw.slice(IMAGE_PREFIX.length) : raw;
}

function paint(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const light = document.documentElement.dataset.glassScheme === "light";
  ctx.clearRect(0, 0, W, H);
  ctx.filter = light ? "blur(3px) saturate(1.5) brightness(1.1)" : "blur(3px) saturate(1.7) brightness(0.8)";
  // Cover-fit the square art into the wide canvas, overscanning so the blur has no transparent edge.
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 1.3;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);

  // Legibility tint, drawn here rather than as a second full-window CSS layer: stacking two large
  // gradient layers leaves a hard horizontal seam in Chromium.
  ctx.filter = "none";
  const [r, g, b] = light ? [255, 255, 255] : tintRgb();
  const [top, bottom] = light ? [0.35, 0.6] : [0.2, 0.42];
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${top})`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${bottom})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function tintRgb(): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue("--spice-main").trim().replace("#", "");
  const n = parseInt(hex, 16);
  return hex.length === 6 ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [18, 20, 31];
}

export function initBackdrop(): void {
  if (document.querySelector(".glass-backdrop")) return;

  const root = document.createElement("div");
  root.className = "glass-backdrop";
  const layers = [0, 1].map(() => {
    const el = document.createElement("canvas");
    el.className = "glass-backdrop__layer";
    el.width = W;
    el.height = H;
    root.appendChild(el);
    return el;
  });
  document.body.prepend(root);

  let active = 0;
  let current: string | null = null;

  function show(url: string | null): void {
    if (url === current) return;
    current = url;
    const next = layers[1 - active];
    const prev = layers[active];
    if (!url) {
      prev.classList.remove("is-visible");
      return;
    }
    // Load first so the crossfade never shows an empty layer.
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (current !== url) return;
      paint(next, img);
      next.classList.add("is-visible");
      prev.classList.remove("is-visible");
      active = 1 - active;
    };
    img.src = url;
  }

  const refresh = () => show(artUrl());
  window.Spicetify?.Player?.addEventListener("songchange", refresh);
  window.Spicetify?.Player?.addEventListener("onplaypause", refresh);

  // Player data is often not ready when the theme loads and no songchange follows, so retry briefly.
  let tries = 0;
  const timer = setInterval(() => {
    refresh();
    if (current || ++tries > 40) clearInterval(timer);
  }, 500);
  refresh();
}
