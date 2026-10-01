#!/usr/bin/env bash
# Installs the Glass theme into Spicetify and applies it.
# Run from a release download, or from the repo (dist/Glass is committed).
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
source="$here/dist/Glass"
[ -d "$source" ] || source="$here/Glass"
[ -f "$source/user.css" ] || { echo "Glass theme files not found. Run 'npm run build' first." >&2; exit 1; }
command -v spicetify >/dev/null || { echo "Spicetify CLI not found. See https://spicetify.app/docs/getting-started" >&2; exit 1; }

target="$(dirname "$(spicetify -c)")/Themes/Glass"
# Replace a development symlink with a real copy; rm on a symlink removes only the link.
[ -L "$target" ] && rm "$target"
mkdir -p "$target"
cp -R "$source/." "$target/"

spicetify config current_theme Glass color_scheme dark inject_css 1 replace_colors 1 inject_theme_js 1 overwrite_assets 1
# Spicetify needs a backup of Spotify's original files before it can apply anything. "backup" makes
# one the first time and exits non-zero when one already exists, which is fine, so its result is ignored.
spicetify backup >/dev/null 2>&1 || true
spicetify apply
