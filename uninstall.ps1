# Turns the Glass theme off and removes it from Spicetify.
# Add -Restore to also put Spotify back to its original, unpatched state.
param([switch]$Restore)
$ErrorActionPreference = "Stop"

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) { throw "Spicetify CLI not found." }

spicetify config current_theme "" color_scheme "" inject_css 0 inject_theme_js 0 replace_colors 0
if ($Restore) { spicetify restore } else { spicetify apply }

$target = Join-Path (Split-Path (spicetify -c)) "Themes\Glass"
if (Test-Path $target) {
    if ((Get-Item $target).LinkType) {
        # A development link: remove only the link, never the files it points to.
        cmd /c rmdir "$target" | Out-Null
    } else {
        Remove-Item $target -Recurse -Force
    }
    Write-Host "Removed $target"
}
Write-Host "Glass is uninstalled."
