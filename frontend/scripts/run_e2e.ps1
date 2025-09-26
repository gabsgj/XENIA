# Start Next dev in background, wait for it to be responsive, then run Node E2E script
$cwd = Split-Path -Parent $MyInvocation.MyCommand.Definition
$frontend = Join-Path $cwd '..' | Resolve-Path -Relative
Write-Host "Working dir: $frontend"

# Start dev server (detached)
Write-Host "Starting dev server..."
Start-Process -NoNewWindow -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory $frontend

# Wait for localhost:3000 to respond
$ready = $false
for ($i=0; $i -lt 60; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -ge 200) { $ready = $true; break }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $ready) {
    Write-Host "Server not ready after timeout"
    exit 1
}

Write-Host "Server is ready — running e2e script..."
node (Join-Path $frontend 'scripts\e2e-upload.js')
Write-Host "E2E script finished"
