@echo off
REM Deploy script for XENIA on Render (Windows)
REM This script helps automate the deployment process

echo 🚀 XENIA Deployment Script for Render
echo ======================================

REM Check if we're in the right directory
if not exist "render.yaml" (
    echo [ERROR] render.yaml not found. Please run this script from the XENIA project root.
    exit /b 1
)

echo [INFO] Checking prerequisites...

REM Check if git is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    exit /b 1
)

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not a git repository. Please initialize git first.
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed!

REM Pre-deployment checks
echo [INFO] Running pre-deployment checks...

REM Check if requirements.txt exists in backend
if not exist "backend\requirements.txt" (
    echo [ERROR] backend\requirements.txt not found!
    exit /b 1
)

REM Check if package.json exists in frontend
if not exist "frontend\package.json" (
    echo [ERROR] frontend\package.json not found!
    exit /b 1
)

echo [SUCCESS] Pre-deployment checks passed!

REM Git operations
echo [INFO] Preparing code for deployment...

REM Check for uncommitted changes
git status --porcelain >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARNING] You have uncommitted changes.
    set /p commit_choice="Do you want to commit all changes? (y/n): "
    if /i "%commit_choice%"=="y" (
        git add .
        set /p commit_message="Enter commit message: "
        if "%commit_message%"=="" (
            set commit_message=Deploy to Render - %date% %time%
        )
        git commit -m "%commit_message%"
        echo [SUCCESS] Changes committed!
    ) else (
        echo [WARNING] Proceeding with uncommitted changes...
    )
)

REM Push to remote
echo [INFO] Pushing to remote repository...
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i
git push origin %current_branch%
echo [SUCCESS] Code pushed to %current_branch% branch!

REM Deployment instructions
echo [INFO] Next steps for Render deployment:
echo.
echo 1. Go to https://render.com and sign in
echo 2. Click 'New +' and select 'Web Service'
echo 3. Connect your GitHub repository
echo 4. Render will detect the render.yaml file and create services automatically
echo.
echo OR manually create services:
echo.
echo 📦 Backend Service:
echo   - Name: xenia-backend
echo   - Environment: Python 3.11
echo   - Build Command: cd backend ^&^& pip install -r requirements.txt
echo   - Start Command: cd backend ^&^& gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 run:app
echo   - Health Check Path: /health
echo.
echo 🌐 Frontend Service:
echo   - Name: xenia-frontend
echo   - Environment: Node 18
echo   - Build Command: cd frontend ^&^& npm ci ^&^& npm run build
echo   - Start Command: cd frontend ^&^& npm start
echo   - Health Check Path: /
echo.
echo 🔐 Environment Variables to set in Render:
echo.
echo Backend:
echo   - GEMINI_API_KEY
echo   - SUPABASE_URL
echo   - SUPABASE_ANON_KEY
echo   - SUPABASE_SERVICE_ROLE_KEY
echo   - FLASK_ENV=production
echo   - LOG_LEVEL=INFO
echo   - EMBEDDING_PROVIDER=gemini
echo   - EMBEDDING_MODEL=text-embedding-004
echo   - ARTIFACTS_BUCKET=artifacts
echo.
echo Frontend:
echo   - NEXT_PUBLIC_SUPABASE_URL=^<your_supabase_url^>
echo   - NEXT_PUBLIC_SUPABASE_ANON_KEY=^<your_supabase_anon_key^>
echo   - NEXT_PUBLIC_API_URL=^<your_backend_service_url^>
echo   - NODE_ENV=production
echo   - NEXT_TELEMETRY_DISABLED=1
echo.
echo [SUCCESS] Deployment preparation complete!
echo [INFO] Your XENIA app is ready for Render deployment! 🎉

REM Optional: Open Render dashboard
set /p open_dashboard="Do you want to open Render dashboard? (y/n): "
if /i "%open_dashboard%"=="y" (
    start https://dashboard.render.com
)

echo.
echo [SUCCESS] 🚀 Happy deploying!
pause
