# Auto-push helper invoked by Kiro hooks (on file save + on agent stop).
# Stages all changes, commits with a timestamped message, and pushes to origin
# on the current branch. Non-destructive: no force-push, no git config changes,
# and it no-ops when there is nothing to commit.
$ErrorActionPreference = 'Continue'

# Run from the repo root (this script lives in <repo>/.kiro/).
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

# Determine the current branch.
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq 'HEAD') {
  Write-Host "auto-push: detached HEAD or unknown branch; skipping."
  exit 0
}

git add -A

# `git diff --cached --quiet` exits 0 when nothing is staged, non-zero otherwise.
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "auto-push: nothing to commit."
  exit 0
}

$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
git commit -m "auto: $ts"

# Plain push (no force) to origin on the current branch.
git push origin $branch
Write-Host "auto-push: committed and pushed to origin/$branch at $ts."
