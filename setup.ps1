# XENIA Setup Script for Windows
# This script sets up both frontend and backend environments

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "    XENIA AI Study Planner Setup     " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check for Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.10+ from python.org" -ForegroundColor Red
    exit 1
}

# Check for Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host ""
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Set-Location -Path "backend"

# Create virtual environment if it doesn't exist
if (!(Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if (!(Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    @"
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI API Keys (at least one required)
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here

# Optional: YouTube API for resources
YOUTUBE_API_KEY=your_youtube_api_key_here

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=true
LOG_LEVEL=INFO
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ Created backend/.env - Please add your API keys!" -ForegroundColor Yellow
}

# Setup Frontend
Write-Host ""
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Set-Location -Path "../frontend"

# Install Node dependencies
Write-Host "Installing Node dependencies..." -ForegroundColor Yellow
npm install

# Create .env.local file if it doesn't exist
if (!(Test-Path ".env.local")) {
    Write-Host "Creating frontend .env.local file..." -ForegroundColor Yellow
    @"
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration (optional for direct frontend access)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✓ Created frontend/.env.local" -ForegroundColor Yellow
}

# Return to root directory
Set-Location -Path ".."

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "        Setup Complete!               " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env and add your API keys" -ForegroundColor White
Write-Host "2. Edit frontend/.env.local if needed" -ForegroundColor White
Write-Host "3. Run ./start.ps1 to launch the application" -ForegroundColor White
Write-Host ""
Write-Host "To start the application manually:" -ForegroundColor Yellow
Write-Host "  Backend:  cd backend && python run.py" -ForegroundColor White
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""