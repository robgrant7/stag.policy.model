@echo off
title STAG Spatial Dispersion Model Launcher
echo ============================================================
echo   STAG SPATIAL DISPERSION MODEL - SCENARIO BUILDER LAUNCHER
echo ============================================================
echo.
echo Starting development server in a new window...
start "STAG Dev Server" cmd /c "npm run dev"

echo Waiting for Vite server to spin up...
timeout /t 3 >nul

echo Opening application in default browser...
start "" http://localhost:5173/

echo.
echo Launch sequence complete. Dev server is running in the background.
echo You can close this window. To stop the dev server, close the other window labeled "STAG Dev Server".
echo ============================================================
pause
