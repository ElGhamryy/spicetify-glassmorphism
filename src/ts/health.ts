// Spotify updates sometimes rename the elements the theme styles; the result is plain, unstyled panels
// with no explanation. Check that the main surfaces can still be found and, if not, say so once per
// Spotify version instead of failing silently.

import { selector } from "./selectors";

const KEY = "glass:layout-warned";

function check(): string[] {
  return selector("health")
    .split(", ")
    .filter((s) => s && !document.querySelector(s));
}

export function initHealth(): void {
  const sp = window.Spicetify;
  // The UI can take a few seconds to mount, so look twice before concluding anything is missing.
  setTimeout(() => {
    if (!check().length) return;
    setTimeout(() => {
      const missing = check();
      if (!missing.length) return;
      console.warn("[glass] Spotify's layout changed; these selectors match nothing:", missing);
      const version = String(sp?.Platform?.version ?? "unknown");
      try {
        if (localStorage.getItem(KEY) === version) return;
        localStorage.setItem(KEY, version);
      } catch {
        /* storage unavailable: warn every start rather than never */
      }
      sp?.showNotification?.("Glass: Spotify's layout changed, so part of the theme is not applied. Update the theme to fix it.", true);
    }, 10000);
  }, 6000);
}
