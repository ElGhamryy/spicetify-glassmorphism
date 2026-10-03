// Entry point. Each module starts on its own so one failure cannot take the theme down.
import { applyScheme } from "./scheme";
import { initBackdrop } from "./backdrop";
import { initSticky } from "./sticky";
import { initOpaque } from "./opaque";
import { initHealth } from "./health";
import { initSettings, registerPanel } from "./settings";

function safe(name: string, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    console.error(`[glass] ${name} failed`, err);
  }
}

// Topbar is only available once Spotify's UI has loaded.
function whenUiReady(fn: () => void, tries = 0): void {
  const s = window.Spicetify;
  if (s?.Topbar?.Button) return fn();
  if (tries < 100) setTimeout(() => whenUiReady(fn, tries + 1), 300);
}

(function glass() {
  if (!window.Spicetify?.Player || !document.body) {
    setTimeout(glass, 300);
    return;
  }
  document.documentElement.classList.add("glass");
  safe("scheme", applyScheme);
  safe("settings", initSettings);
  safe("backdrop", initBackdrop);
  safe("sticky", initSticky);
  safe("opaque", initOpaque);
  safe("health", initHealth);
  whenUiReady(() => safe("panel", registerPanel));
})();
