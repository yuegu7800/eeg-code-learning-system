@echo off
setlocal
cd /d "%~dp0"

curl.exe -s --max-time 1 "http://127.0.0.1:4312" >nul 2>&1
if errorlevel 1 (
  start "EEG Learning Server" /min node server.mjs
  for /L %%i in (1,1,15) do (
    curl.exe -s --max-time 1 "http://127.0.0.1:4312" >nul 2>&1
    if not errorlevel 1 goto :open
    timeout /t 1 /nobreak >nul
  )
  echo The local server did not start. Run npm start in this folder to inspect the error.
  pause
  exit /b 1
)

:open
start "" "http://127.0.0.1:4312"
