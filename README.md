# Glass for Spicetify

A frosted-glass theme for [Spicetify](https://spicetify.app/), inspired by Apple's translucent materials.
Floating rounded panels, backdrop blur, soft edge highlights, and an album-art backdrop that crossfades on every track.

Written in SCSS and TypeScript. Built and tested on Windows with desktop Spotify and Spicetify 2.45.

## Requirements

1. **Desktop Spotify** from [spotify.com/download](https://www.spotify.com/download). The Microsoft Store version does not work: Spicetify cannot patch it.
2. **The Spicetify CLI.** See the [getting started guide](https://spicetify.app/docs/getting-started), or on Windows:
   ```powershell
   winget install Spicetify.Spicetify
   ```

Node.js is only needed if you build the theme yourself.

## Install

Download this repository (or a release), then run the installer from its folder.

**Windows (PowerShell)**

```powershell
./install.ps1
```

**macOS / Linux**

```bash
./install.sh
```

The script copies the theme into Spicetify's `Themes` folder, sets it as the active theme, and runs `spicetify apply`, which restarts Spotify. Spotify must have been launched at least once and be logged in.

To do the same by hand:

```bash
# copy dist/Glass into the folder printed by: spicetify -c   (then Themes/Glass)
spicetify config current_theme Glass color_scheme dark inject_css 1 replace_colors 1 inject_theme_js 1 overwrite_assets 1
spicetify apply
```

### Color schemes

`dark` (default), `graphite` and `light`:

```bash
spicetify config color_scheme graphite
spicetify apply
```

### Settings

Click the sliders icon in the top bar, next to the Spicetify icon:

- Album art backdrop: on or off
- Blur: low, medium, high
- Frost (panel opacity): low, medium, high

If Spotify feels slow, set Blur to Low. Settings are saved in Spotify's local storage.

## Uninstall

Turn the theme off and remove it, keeping Spicetify:

```powershell
./uninstall.ps1          # macOS / Linux: ./uninstall.sh
```

Also put Spotify back to its original, unpatched state:

```powershell
./uninstall.ps1 -Restore    # macOS / Linux: ./uninstall.sh --restore
```

To remove Spicetify itself afterwards (Windows):

```powershell
spicetify restore
winget uninstall Spicetify.Spicetify
```

then delete `%APPDATA%\spicetify` and `%LOCALAPPDATA%\spicetify`.

## Troubleshooting

- **Spotify updated and the theme looks broken or is gone.** Spotify updates overwrite Spicetify's patch. Run:
  ```bash
  spicetify restore backup apply
  ```
- **`spicetify apply` fails or reports it cannot find Spotify.** You probably have the Microsoft Store version. Uninstall it and install the desktop version.
- **Spotify is slow.** Set Blur to Low in the Glass settings, or turn off the album art backdrop. The blur on large panels is the main cost.
- **The minimize, maximize and close buttons look darker than the rest of the top bar.** Windows draws those buttons, so the theme cannot style them. The Fluent theme documents a `--transparent-window-controls` Spotify launch flag for this. It is untested with Glass.
- **A page shows a solid colour band or a hard edge.** Spotify renames its CSS classes between releases. Please open an issue with a screenshot and the page you were on.

## Develop

```bash
npm install
npm run dev       # watch: SCSS -> user.css, TS -> theme.js, color.ini -> dist/Glass
npm run build     # one-off minified build into dist/Glass (committed, so the theme installs without Node)
npm run link      # junction dist/Glass into Spicetify's Themes folder
```

With the theme linked, run `spicetify enable-devtools` once, then `spicetify watch -s` in another terminal to reload Spotify on every change. Stop both when you are done: they add overhead to Spotify.

Rebuild (`npm run build`) before committing, so `dist/Glass` matches the source.

Layout of `src/`:

| Path | Purpose |
|---|---|
| `scss/_tokens.scss` | Blur, fill, rim, shadow, radius and motion tokens |
| `scss/_mixins.scss` | `glass()`, `glass-flat()`, `glass-panel()`, `clear`, `lift` |
| `scss/_selectors.scss` | Every Spotify class name the theme uses. Fix breakage here first |
| `scss/_layout.scss`, `_components.scss`, `_backdrop.scss`, `_settings.scss` | Styling |
| `ts/backdrop.ts` | Album-art backdrop, drawn on small canvases |
| `ts/settings.ts` | Top-bar button and settings popover |
| `ts/opaque.ts` | Finds solid background bands by colour and marks them for CSS |
| `ts/sticky.ts` | Pinned track-list header detection, scrolling artist-photo header |
| `ts/scheme.ts` | Light or dark scheme detection |
| `color.ini` | Color schemes |

Reference notes: [docs/selectors.md](docs/selectors.md).

## Known limits

- The top bar and pinned track-list header use a mostly opaque tint instead of live blur, because blur does not reach the scrolling rows underneath in Spotify's renderer.
- Cards and sidebar sections have no blur of their own: a blur nested inside another blur draws a hard seam.
- Spicetify's built-in popup modal and profile-menu items do not show on current Spotify builds, so settings use their own popover.
- Not tested on macOS or Linux.

## License

[MIT](LICENSE)
