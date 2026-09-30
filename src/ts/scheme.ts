// Marks :root as a light or dark scheme so the tokens can adjust rim and shadow strength.
// Reads --spice-main (filled from color.ini) and uses relative luminance.

function luminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function applyScheme(): void {
  const root = document.documentElement;
  const hex = getComputedStyle(root).getPropertyValue("--spice-main").trim().replace("#", "");
  if (hex.length !== 6) return;
  const n = parseInt(hex, 16);
  const l = luminance((n >> 16) & 255, (n >> 8) & 255, n & 255);
  root.dataset.glassScheme = l > 0.4 ? "light" : "dark";
}
