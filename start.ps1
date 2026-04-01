# XENIA Startup Script for Windows
# Launches both backend and frontend servers

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Starting XENIA AI Study Suite   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if setup has been run
if (!(Test-Path "backend/.venv") -or !(Test-Path "frontend/node_modules")) {
    Write-Host "Setup not complete. Running setup first..." -ForegroundColor Yellow
    & .\setup.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Setup failed. Please fix the issues and try again." -ForegroundColor Red
        exit 1
    }
}

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# Check if ports are available
if (Test-Port 8000) {
    Write-Host "⚠ Port 8000 is already in use (Backend)" -ForegroundColor Yellow
    $response = Read-Host "Kill existing process? (y/n)"
    if ($response -eq 'y') {
        Get-Process | Where-Object {$_.Id -eq (Get-NetTCPConnection -LocalPort 8000).OwningProcess} | Stop-Process -Force
        Start-Sleep -Seconds 1
    }
}

if (Test-Port 3000) {
    Write-Host "⚠ Port 3000 is already in use (Frontend)" -ForegroundColor Yellow
    $response = Read-Host "Kill existing process? (y/n)"
    if ($response -eq 'y') {
        Get-Process | Where-Object {$_.Id -eq (Get-NetTCPConnection -LocalPort 3000).OwningProcess} | Stop-Process -Force
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Green
# Start backend in a new window
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\Activate.ps1; python run.py" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Server..." -ForegroundColor Green
# Start frontend in a new window
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 5

# Check if processes started successfully
if ($backend.HasExited) {
    Write-Host "✗ Backend failed to start" -ForegroundColor Red
} else {
    Write-Host "✓ Backend running on http://localhost:8000" -ForegroundColor Green
}

if ($frontend.HasExited) {
    Write-Host "✗ Frontend failed to start" -ForegroundColor Red
} else {
    Write-Host "✓ Frontend running on http://localhost:3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "     XENIA is now running!            " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  → http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "API Documentation at:" -ForegroundColor Cyan
Write-Host "  → http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Yellow
Write-Host ""

# Open browser automatically
$openBrowser = Read-Host "Open in browser now? (y/n)"
if ($openBrowser -eq 'y') {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
}

Write-Host "Monitoring servers... Press Ctrl+C to exit monitor" -ForegroundColor Gray
Write-Host ""

# Keep the script running and monitor
while ($true) {
    if ($backend.HasExited -or $frontend.HasExited) {
        Write-Host "One or more servers have stopped!" -ForegroundColor Red
        if ($backend.HasExited) {
            Write-Host "  Backend has stopped" -ForegroundColor Red
        }
        if ($frontend.HasExited) {
            Write-Host "  Frontend has stopped" -ForegroundColor Red
        }
        break
    }
    Start-Sleep -Seconds 5
}
