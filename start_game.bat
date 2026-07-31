@echo off
setlocal
cd /d "%~dp0"
set "GAME_PORT=4317"

start "" "http://127.0.0.1:%GAME_PORT%/"

where py >nul 2>nul
if not errorlevel 1 (
  py -m http.server %GAME_PORT% --bind 127.0.0.1
  goto :done
)

python -m http.server %GAME_PORT% --bind 127.0.0.1

:done
if errorlevel 1 (
  echo.
  echo Python 실행 또는 포트 사용 여부를 확인해 주세요.
  pause
)
