Set-StrictMode -Version Latest
Set-Location -LiteralPath 'D:\GECT\XENIA'
$files = @(
  'CLEANUP_SUMMARY.md',
  'DEPLOYMENT_SUCCESS_SUMMARY.md',
  'ENHANCED_CONTENT_RECOMMENDATIONS_COMPLETE.md',
  'ENHANCED_TOPIC_EXTRACTION_SUMMARY.md',
  'UPLOAD_FIX_SUMMARY.md',
  'UI_UX_IMPROVEMENTS_SUMMARY.md',
  'SETUP_COMPLETE.md',
  'RENDER_DEPLOYMENT_FIX.md',
  'IMPLEMENTATION_COMPLETE.md',
  'PRODUCTION_AUTH_FIX_COMPLETE.md'
)
$existing = @()
$tracked = @()
foreach ($f in $files) {
    if (Test-Path -LiteralPath $f) {
        $existing += $f
    }
    try {
        git ls-files --error-unmatch -- $f > $null 2>&1
        if ($LASTEXITCODE -eq 0) { $tracked += $f }
    } catch {
        # ignore
    }
}
if ($existing.Count -gt 0) {
    Write-Host "Deleting files from disk..."
    foreach ($e in $existing) {
        try {
            Remove-Item -LiteralPath $e -Force
            Write-Host "Deleted: $e"
        } catch {
            Write-Host "Failed to delete: $e - $_"
        }
    }
} else {
    Write-Host "No candidate files found on disk"
}
if ($tracked.Count -gt 0) {
    Write-Host "Staging tracked deletions:"
    $tracked | ForEach-Object { Write-Host " - $_" }
    git rm -- $tracked
    git commit -m 'chore(docs): remove one-off completion and summary markdown files'
    git push
} else {
    Write-Host "No tracked candidate files to git rm/commit"
}
Write-Host "Done."
