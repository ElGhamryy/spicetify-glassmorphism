// Spotify selectors are defined once, in src/scss/_selectors.scss, and published as CSS variables
// (see _backdrop.scss). Reading them here keeps the scripts from repeating, and drifting from, the stylesheet.

const VARS = {
  panels: "--glass-panels",
  scopes: "--glass-sel-scopes",
  sidebar: "--glass-sel-sidebar",
  mainView: "--glass-sel-main-view",
  trackHeader: "--glass-sel-track-header",
} as const;

const cache = new Map<string, string>();

// Cached: some callers run on every scroll frame, and reading a custom property forces style resolution.
export function selector(name: keyof typeof VARS): string {
  let value = cache.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement).getPropertyValue(VARS[name]).trim();
    if (value) cache.set(name, value);
  }
  return value;
}
