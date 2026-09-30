# Reference notes and selector cheat-sheet

Source: Bloom, Flow, Turntable, Dribbblish (spicetify-themes) and Fluent, read on 2026-09-30.
**Unverified.** These come from summaries of each theme's files, not from Spotify's live DOM.
Re-check every selector in devtools during step 3 before relying on it.

## What each reference teaches

| Theme | Takeaway for Glass |
|---|---|
| Bloom | Closest to our goal. Uses `backdrop-filter` on modals, connect bar, now-playing bar. One `--blur-radius` variable. Noise texture on `::before` of glass surfaces. Transparency built from `rgba(var(--spice-rgb-main), a)`. Hides scrollbars behind a `--scrollbars` toggle. |
| Bloom `theme.js` | Album art from `Spicetify.Player.data.item.metadata.image_xlarge_url`, drawn to a canvas; `songchange` listener; crossfade on change; `Spicetify.Platform.History.listen()` for page navigation; `MutationObserver` on body for theme changes. |
| Turntable | Only theme with explicit `backdrop-filter: blur(20px) saturate(180%)` (full app display). Shows the `#fad-*` ids for the expanded now-playing view. |
| Flow | Gradient backgrounds via `--gradient-colors`; grid layout on `.Root__top-container`. No blur. Useful only for layout. |
| Dribbblish | Uses `Spicetify.Platform...client_version_int` to add version classes on `:root` (`legacy`, `ylx`) so one stylesheet handles several Spotify layouts. Stores settings in `localStorage`. |
| Fluent | Layout reference only (no blur). Ships `manifest.json`, `install.ps1/.sh`, `fluent.js`. Needs a `[Patch]` entry in `config-xpui.ini` for sidebar width. |

## Selectors seen in use (to verify)

**Layout**
- `.Root__top-container` (grid; areas: left-sidebar, main-view, right-sidebar, now-playing-bar)
- `.Root__main-view`, `.Root__nav-bar`, `.Root__right-sidebar`, `.Root__now-playing-bar`
- `.main-topBar-container`, `.main-topBar-background`, `.main-topBar-overlay`

**Now playing / full-screen**
- `.main-nowPlayingBar-container`, `.main-nowPlayingBar-nowPlayingBar`
- `.main-nowPlayingWidget-coverArt`, `.playback-bar`, `.player-controls`
- `#full-app-display`, `#fad-background`, `#fad-art`

**Surfaces that need the thick material**
- `.GenericModal`, `.main-connectBar-connectBar`, `#power-bar-wrapper`, `#recent-searches-dropdown`

**Cards and lists**
- `.main-card-card`, `.main-heroCard-card`, `.x-heroCategoryCard-HeroCategoryCard`
- `.main-cardImage-image`, `.main-trackList-trackListHeader`

**Scrollbars**
- `.os-scrollbar`, `.os-scrollbar-handle`, `.os-scrollbar-vertical`

**Variables to drive from color.ini**
- `--spice-main`, `--spice-sidebar`, `--spice-player`, `--spice-card`, `--spice-text`, `--spice-subtext`, `--spice-button`, `--spice-contour`, plus `--spice-rgb-*` triplets for `rgba()` use.

## Avoid
- Hashed class names such as `.GimJ6fo6WOYPyWNVpSr1` (Bloom uses some). They change with Spotify releases.
- `!important` chains. Bloom leans on them; scope selectors instead.

## Decisions this sets up
1. Build all glass fills as `rgba(var(--spice-rgb-*), alpha)` so color schemes keep working.
2. One `--glass-blur` variable, tunable from the settings menu (step 11).
3. Add a noise texture overlay, inlined as a data URI. Bloom hot-links its PNG, which we should not do.
4. Draw the backdrop ourselves (fixed layer behind `.Root`) rather than per-panel, so all panels blur the same image.
5. Add version classes on `:root` like Dribbblish, to keep layout fixes isolated.
6. Check whether Glass needs a `config-xpui.ini` patch like Fluent's. Decide in step 3.
