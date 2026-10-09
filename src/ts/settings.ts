// User options: stored in localStorage, applied as CSS variables / attributes on :root,
// and edited in a small panel opened from a button in the top bar.

type Level = "low" | "medium" | "high";

interface Settings {
  backdrop: boolean;
  blur: Level;
  opacity: Level;
}

const KEY = "glass:settings";
const DEFAULTS: Settings = { backdrop: true, blur: "medium", opacity: "medium" };
const LEVELS: Level[] = ["low", "medium", "high"];
const BLUR_SCALE: Record<Level, number> = { low: 0.5, medium: 1, high: 1.6 };
const OPACITY_SCALE: Record<Level, number> = { low: 0.55, medium: 1, high: 1.6 };

const ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 3.5h7.1a2 2 0 0 1 3.8 0H14v1h-1.1a2 2 0 0 1-3.8 0H2v-1zm9 1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM2 11.5h1.1a2 2 0 0 1 3.8 0H14v1H6.9a2 2 0 0 1-3.8 0H2v-1zm3 1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>';

let settings: Settings = { ...DEFAULTS };

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { ...DEFAULTS };
  }
}

function apply(): void {
  const root = document.documentElement;
  root.style.setProperty("--glass-blur-scale", String(BLUR_SCALE[settings.blur]));
  root.style.setProperty("--glass-opacity-scale", String(OPACITY_SCALE[settings.opacity]));
  root.dataset.glassBackdrop = settings.backdrop ? "on" : "off";
}

function save(): void {
  apply();
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable: settings last for this session only */
  }
}

export function initSettings(): void {
  settings = load();
  apply();
}

function row(title: string, control: HTMLElement): HTMLElement {
  const el = document.createElement("div");
  el.className = "glass-setting";
  const label = document.createElement("span");
  label.textContent = title;
  el.append(label, control);
  return el;
}

function segmented(current: Level, onChange: (l: Level) => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "glass-segmented";
  for (const level of LEVELS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = level[0].toUpperCase() + level.slice(1);
    b.classList.toggle("is-active", level === current);
    b.addEventListener("click", () => {
      wrap.querySelectorAll("button").forEach((x) => x.classList.toggle("is-active", x === b));
      onChange(level);
    });
    wrap.appendChild(b);
  }
  return wrap;
}

function toggle(current: boolean, onChange: (v: boolean) => void): HTMLElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "glass-switch";
  b.setAttribute("role", "switch");
  b.setAttribute("aria-checked", String(current));
  b.addEventListener("click", () => {
    const next = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", String(next));
    onChange(next);
  });
  return b;
}

function buildPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "glass-settings";
  panel.append(
    row(
      "Album art backdrop",
      toggle(settings.backdrop, (v) => {
        settings.backdrop = v;
        save();
      }),
    ),
    row(
      "Menu blur",
      segmented(settings.blur, (l) => {
        settings.blur = l;
        save();
      }),
    ),
    row(
      "Frost",
      segmented(settings.opacity, (l) => {
        settings.opacity = l;
        save();
      }),
    ),
  );
  return panel;
}

// Spicetify's PopupModal renders off-screen on current Spotify builds, so the panel is our own
// fixed popover, toggled by a top-bar button and dismissed by clicking outside or pressing Escape.
function togglePopover(): void {
  const existing = document.querySelector(".glass-popover");
  if (existing) {
    existing.remove();
    return;
  }
  const pop = document.createElement("div");
  pop.className = "glass-popover";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Glass settings");
  const title = document.createElement("h2");
  title.textContent = "Glass";
  pop.append(title, buildPanel());
  document.body.appendChild(pop);

  const close = (e: Event) => {
    if (e instanceof KeyboardEvent ? e.key !== "Escape" : pop.contains(e.target as Node)) return;
    pop.remove();
    document.removeEventListener("mousedown", close, true);
    document.removeEventListener("keydown", close, true);
  };
  // Register after the opening click has finished so it does not close the popover at once.
  setTimeout(() => {
    document.addEventListener("mousedown", close, true);
    document.addEventListener("keydown", close, true);
  });
}

const LABEL = "Glass settings";

// Spicetify mounts its top-bar buttons by one of Spotify's class names, and each Spotify update that
// renames it leaves the button missing (the CLI is usually updated a while later). So after giving
// Spicetify a moment, check that the button exists, and if not mount our own beside the history
// arrows, found by position rather than by class. The arrows are cloned so the button matches them.
function mountOwnButton(): void {
  if (document.querySelector(`[aria-label="${LABEL}"]`)) return;
  const arrows = document.querySelectorAll<HTMLElement>("#global-nav-bar > :nth-child(2) button");
  const anchor = arrows[arrows.length - 1];
  if (!anchor) return;
  const button = anchor.cloneNode(true) as HTMLElement;
  button.removeAttribute("disabled");
  button.removeAttribute("aria-disabled");
  button.removeAttribute("data-testid");
  button.setAttribute("aria-label", LABEL);
  button.setAttribute("title", LABEL);
  const icon = button.querySelector("span") ?? button;
  icon.innerHTML = ICON;
  button.addEventListener("click", togglePopover);
  anchor.after(button);
}

export function registerPanel(): void {
  const sp = window.Spicetify;
  if (sp?.Topbar) new sp.Topbar.Button(LABEL, ICON, togglePopover);
  // The top bar can mount late, and can be re-rendered (dropping our button), so check a few times.
  for (const ms of [2500, 6000, 12000]) setTimeout(mountOwnButton, ms);
}
