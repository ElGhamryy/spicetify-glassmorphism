#!/usr/bin/env bash
# Turns the Glass theme off and removes it from Spicetify.
# Pass --restore to also put Spotify back to its original, unpatched state.
set -euo pipefail

command -v spicetify >/dev/null || { echo "Spicetify CLI not found." >&2; exit 1; }

spicetify config current_theme "" color_scheme "" inject_css 0 inject_theme_js 0 replace_colors 0
if [ "${1:-}" = "--restore" ]; then spicetify restore; else spicetify apply; fi

target="$(dirname "$(spicetify -c)")/Themes/Glass"
if [ -L "$target" ]; then
  rm "$target"   # a development symlink: remove only the link
elif [ -d "$target" ]; then
  rm -r "$target"
fi
echo "Glass is uninstalled."
