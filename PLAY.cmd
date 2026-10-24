@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8788
echo ============================================
echo  流浪仙境 · 本機版
echo --------------------------------------------
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=1" %%b in ("%%a") do echo  電腦:  http://127.0.0.1:%PORT%/index.html
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=1" %%b in ("%%a") do echo  手機:  http://%%b:%PORT%/index.html
)
echo ============================================
echo  關掉這個視窗 = 停止伺服器
echo.
start "" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:%PORT%/index.html"
python -m http.server %PORT% --bind 0.0.0.0
