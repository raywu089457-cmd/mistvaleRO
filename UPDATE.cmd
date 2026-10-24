@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === 流浪仙境 本機鏡像 · 更新 ===
echo 只會抓有變動的檔案，每個請求間隔 1.1 秒。
echo.
node update.mjs %*
echo.
pause
