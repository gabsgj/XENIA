@echo off
setlocal ENABLEDELAYEDEXPANSION

rem XENIA unified dev launcher

cd /d %~dp0

if not exist backend\venv (
  echo Creating Python virtual environment...
  py -3 -m venv backend\venv || python -m venv backend\venv
)

call backend\venv\Scripts\activate.bat
pip install --upgrade pip >NUL 2>&1
pip install -r backend\requirements.txt || goto :pipfail

echo.
echo [Backend ENV Detection]
if exist .env (
  echo   Found root .env
) else (
  if exist backend\.env (
    echo   Found backend/.env
  ) else (
    echo   WARNING: No .env file found. Create one from .env.example
  )
)

echo Starting backend (port 8000)...
start "xenia-backend" /D backend cmd /c "call venv\Scripts\activate.bat && python run.py"

cd frontend
if not exist node_modules (
  echo Installing frontend dependencies...
  npm install || goto :npmfail
)

echo Starting frontend (port 3000)...
start "xenia-frontend" cmd /c "npm run dev"
cd ..

echo.
echo Services launching... (backend: http://localhost:8000  frontend: http://localhost:3000)
echo Press Ctrl+C in this window to exit monitors.

:loop
ping -n 6 127.0.0.1 >NUL
if not exist backend\venv\Scripts\python.exe goto :end
goto :loop

:pipfail
echo Pip install failed. Check errors above.
goto :end
:npmfail
echo npm install failed. Check errors above.
:end
endlocal
