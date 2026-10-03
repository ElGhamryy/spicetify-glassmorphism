# Keeps Glass working after Spotify updates (Windows).
#
# Spotify updates itself and the update overwrites Spicetify's patch, so the theme disappears until
# someone re-applies it; sometimes the Spicetify CLI also needs updating to match the new Spotify.
# This script notices that Spotify's version no longer matches Spicetify's backup, then updates the
# CLI and re-applies the theme.
#
#   ./auto-repair.ps1            check now and repair if needed
#   ./auto-repair.ps1 -DryRun    say what it would do, change nothing
#   ./auto-repair.ps1 -Enable    run it automatically at sign-in and every 6 hours (a scheduled task)
#   ./auto-repair.ps1 -Disable   remove the scheduled task
#
# A repair restarts Spotify for a few seconds. It cannot fix Spotify renaming the elements the
# theme styles; for that, update the theme (see README, Troubleshooting).
param([switch]$Enable, [switch]$Disable, [switch]$DryRun)
$ErrorActionPreference = "Stop"

$taskName = "Glass auto-repair"
$home_ = Join-Path $env:APPDATA "spicetify"
$installed = Join-Path $home_ "glass-auto-repair.ps1"
$log = Join-Path $env:LOCALAPPDATA "spicetify-glass-auto-repair.log"

function Write-Log([string]$msg) {
    $line = "{0:yyyy-MM-dd HH:mm:ss}  {1}" -f (Get-Date), $msg
    Write-Host $line
    if (-not $DryRun) {
        if ((Test-Path $log) -and (Get-Item $log).Length -gt 200KB) { Remove-Item $log -Force }
        Add-Content -Path $log -Value $line
    }
}

if ($Disable) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Remove-Item $installed -Force -ErrorAction SilentlyContinue
    Write-Host "Auto-repair is off."
    return
}

if ($Enable) {
    # Run from a stable copy so the task keeps working if this folder is moved or deleted.
    New-Item -ItemType Directory -Force $home_ | Out-Null
    Copy-Item $PSCommandPath $installed -Force
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$installed`""
    $triggers = @(
        (New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME),
        (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours 6))
    )
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers -Settings $settings -Force | Out-Null
    Write-Host "Auto-repair is on: it checks at sign-in and every 6 hours. Log: $log"
    return
}

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) { Write-Log "Spicetify CLI not found; nothing to do."; return }

$config = (spicetify -c) | Select-Object -First 1
$spotifyDir = ((Get-Content $config) | Where-Object { $_ -match '^\s*spotify_path\s*=\s*(.+?)\s*$' } | ForEach-Object { $Matches[1] } | Select-Object -First 1)
if (-not $spotifyDir) { $spotifyDir = Join-Path $env:APPDATA "Spotify" }
$exe = Join-Path $spotifyDir "Spotify.exe"
if (-not (Test-Path $exe)) { Write-Log "Spotify not found at $exe; nothing to do."; return }

$spotifyVersion = (Get-Item $exe).VersionInfo.ProductVersion
# [Backup] version looks like "1.3.3.264.gdaf3b824": the Spotify version plus a build hash.
$inBackup = $false
$backupVersion = $null
foreach ($line in Get-Content $config) {
    if ($line -match '^\[(.+)\]') { $inBackup = ($Matches[1] -eq "Backup"); continue }
    if ($inBackup -and $line -match '^\s*version\s*=\s*(\S+)') { $backupVersion = $Matches[1]; break }
}

$mismatch = (-not $backupVersion) -or (-not $backupVersion.StartsWith($spotifyVersion))
$css = Join-Path $spotifyDir "Apps\xpui\user.css"
$patchMissing = -not ((Test-Path $css) -and ((Get-Item $css).Length -gt 0))

if (-not $mismatch -and -not $patchMissing) { Write-Log "Spotify $spotifyVersion matches the backup and the theme is applied. Nothing to do."; return }

$why = if ($mismatch) { "Spotify is $spotifyVersion but the backup is $backupVersion" } else { "the theme is not applied" }
if ($DryRun) { Write-Log "Would repair ($why)."; return }
Write-Log "Repairing: $why."

# Spicetify prints progress to the console and can stay attached to the Spotify it launches, so run it
# with output to a file and a time limit rather than waiting on it indefinitely.
function Invoke-Spicetify([string[]]$arguments, [int]$seconds) {
    $out = Join-Path $env:TEMP "glass-auto-repair-out.txt"
    $p = Start-Process spicetify -ArgumentList $arguments -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
    if (-not $p.WaitForExit($seconds * 1000)) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Write-Log "spicetify $($arguments -join ' ') still running after ${seconds}s; moved on." }
    elseif ($p.ExitCode -ne 0) { Write-Log "spicetify $($arguments -join ' ') exited with $($p.ExitCode)." }
}

if ($mismatch) {
    # The CLI has to know the new Spotify build; this also fixes Spicetify's own UI hooks (e.g. its
    # top-bar button), which broke on an old CLI.
    Invoke-Spicetify @("update") 180
    # A new Spotify needs a fresh backup, so "backup apply" rather than "apply".
    Invoke-Spicetify @("backup", "apply") 180
} else {
    Invoke-Spicetify @("apply") 180
}

if ((Test-Path $css) -and ((Get-Item $css).Length -gt 0)) { Write-Log "Done: the theme is applied." }
else { Write-Log "Finished, but the theme still is not applied. Run 'spicetify backup apply' by hand and check its output." }
