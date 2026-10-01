# Installs the Glass theme into Spicetify and applies it.
# Run from a release download, or from the repo (dist/Glass is committed).
$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "dist\Glass"
if (-not (Test-Path $source)) { $source = Join-Path $PSScriptRoot "Glass" }
if (-not (Test-Path (Join-Path $source "user.css"))) { throw "Glass theme files not found. Run 'npm run build' first." }

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) { throw "Spicetify CLI not found. See https://spicetify.app/docs/getting-started" }

$configDir = Split-Path (spicetify -c)
$target = Join-Path $configDir "Themes\Glass"

# A development setup links Themes\Glass to dist\Glass. Replace a link with a real copy so the
# install never copies a folder onto itself. rmdir removes only the link, not the files it points to.
if ((Test-Path $target) -and ((Get-Item $target).LinkType)) { cmd /c rmdir "$target" | Out-Null }

New-Item -ItemType Directory -Force $target | Out-Null
Copy-Item "$source\*" $target -Recurse -Force

spicetify config current_theme Glass color_scheme dark inject_css 1 replace_colors 1 inject_theme_js 1 overwrite_assets 1
# Spicetify needs a backup of Spotify's original files before it can apply anything. "backup" makes
# one the first time and exits non-zero when one already exists, which is fine, so its result is ignored.
spicetify backup *> $null
spicetify apply
